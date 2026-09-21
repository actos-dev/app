/**
 * `/watchlist` testleri (Faz 3 / Birim 3.4, P-02, U-12, U-13, S-11).
 *
 * Sayfa sunucu bileşenidir; testte doğrudan çağrılıp çözülür ve `global.fetch`
 * mock'lanır. İstemci tablo gerçek `tr` kataloğuyla render edilir.
 *
 * Doğrulananlar:
 *   - `/companies/summary` için TEK toplu istek (satır başına istek / N+1 yok),
 *   - optimistic favori kaldırma ve hata halinde geri alma,
 *   - boş durumda "Piyasalara git" CTA'sı ve hiç fiyat isteği olmaması,
 *   - çözülemeyen sembol notu,
 *   - 429'da nazik hata durumu.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import WatchlistPage from "@/app/(app)/(private)/watchlist/page";
import { renderWithIntl } from "@/test/test-utils";
import { mockResponse } from "@/test/http";
import type { CompanySummary } from "@/types/market";

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

vi.mock("next-intl/server", async () => {
  const messages = (await import("../../../../../../messages/tr.json")).default as Record<string, unknown>;
  const resolve = (
    namespace: string | undefined,
    key: string,
    values?: Record<string, unknown>,
  ): string => {
    const path = namespace ? `${namespace}.${key}` : key;
    let current: unknown = messages;
    for (const part of path.split(".")) {
      current =
        current !== null && typeof current === "object"
          ? (current as Record<string, unknown>)[part]
          : undefined;
    }
    if (typeof current !== "string") {
      return path;
    }
    if (!values) {
      return current;
    }
    return current.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in values ? String(values[name]) : match,
    );
  };
  return {
    getTranslations:
      (namespace?: string) =>
      (key: string, values?: Record<string, unknown>) =>
        resolve(namespace, key, values),
  };
});

// jsdom öğe boyutlarını 0 döndürür; sanallaştırıcı satırları çizebilsin diye.
const originalOffsetHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetHeight",
);
const originalOffsetWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetWidth",
);

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => 480,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 800,
  });
});

afterAll(() => {
  if (originalOffsetHeight) {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
  }
  if (originalOffsetWidth) {
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  }
});

const statusPayload = {
  open: true,
  next_open_at: null,
  timezone: "Europe/Istanbul",
  is_holiday: false,
  holiday_name: null,
  as_of: "2026-09-21T08:00:00Z",
};

function company(ticker: string, name: string, changePct: number): CompanySummary {
  return {
    ticker,
    name,
    sector: null,
    last_price: 100,
    change_pct: changePct,
    previous_close: 99,
    absolute_change: 1,
    change_window: "last_session_change",
    market_status: "open",
    is_stale: false,
    as_of: "2026-09-21T08:00:00Z",
    previous_close_as_of: null,
    day_high: null,
    day_low: null,
    volume: 1_000_000,
    market_cap: 1_000_000_000,
    currency: "TRY",
    price_updated_at: null,
  };
}

type Deferred = {
  promise: Promise<Response>;
  resolve: (response: Response) => void;
  reject: (error: unknown) => void;
};

function deferred(): Deferred {
  let resolve!: (response: Response) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Response>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type FetchCall = { method: string; path: string; url: string };

let calls: FetchCall[] = [];
let favorites: string[] = [];
let summaryRows: CompanySummary[] = [];
let summaryStatus = 200;
let deleteResponse: (() => Response | Promise<Response> | null) | null = null;

function installFetch() {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const raw =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(raw, "http://localhost:3000");
      const path = url.pathname;
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ method, path, url: url.toString() });

      if (path === "/api/v1/market/status") {
        return mockResponse(statusPayload);
      }
      if (path === "/api/v1/favorites" && method === "GET") {
        return mockResponse({ favorites });
      }
      if (path.startsWith("/api/v1/favorites/") && method === "DELETE") {
        if (deleteResponse) {
          const response = deleteResponse();
          if (response === null) {
            throw new Error("backend unreachable");
          }
          return response;
        }
        return mockResponse({ message: "ok" });
      }
      if (path === "/api/v1/companies/summary") {
        if (summaryStatus !== 200) {
          return mockResponse({ detail: "too many requests" }, summaryStatus);
        }
        return mockResponse({ data: summaryRows, total: summaryRows.length });
      }
      return null;
    }),
  );
}

function renderPage(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const summaryCalls = () =>
  calls.filter((call) => call.path === "/api/v1/companies/summary");

beforeEach(() => {
  calls = [];
  favorites = [];
  summaryRows = [];
  summaryStatus = 200;
  deleteResponse = null;
  pushMock.mockReset();
  refreshMock.mockReset();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
  installFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/watchlist — dolu liste", () => {
  it("tek toplu summary isteği atar; satır başına istek yok (P-02)", async () => {
    favorites = ["THYAO", "ASELS"];
    summaryRows = [company("THYAO", "Türk Hava Yolları", 1.2), company("ASELS", "Aselsan", -0.5)];

    renderPage(await WatchlistPage());

    expect(summaryCalls()).toHaveLength(1);
    expect(new URL(summaryCalls()[0]!.url).searchParams.get("tickers")).toBe("THYAO,ASELS");
    expect(calls.some((call) => call.path.startsWith("/api/v1/companies/info/"))).toBe(false);

    expect(await screen.findByText("THYAO")).toBeInTheDocument();
    expect(screen.getByText("ASELS")).toBeInTheDocument();
  });

  it("kaldırmayı optimistic uygular ve ek summary isteği tetiklemez (U-12)", async () => {
    favorites = ["THYAO", "ASELS"];
    summaryRows = [company("THYAO", "Türk Hava Yolları", 1.2), company("ASELS", "Aselsan", -0.5)];
    const del = deferred();
    deleteResponse = () => del.promise;

    const user = userEvent.setup();
    renderPage(await WatchlistPage());

    expect(await screen.findByText("THYAO")).toBeInTheDocument();
    const summaryBefore = summaryCalls().length;

    await user.click(screen.getByRole("button", { name: "Kaldır: THYAO" }));

    // DELETE çözülmeden satır düşmeli (optimistic).
    await waitFor(() => expect(screen.queryByText("THYAO")).not.toBeInTheDocument());
    expect(pushMock).not.toHaveBeenCalled();
    expect(summaryCalls()).toHaveLength(summaryBefore);

    favorites = ["ASELS"];
    await act(async () => {
      del.resolve(mockResponse({ message: "ok" }));
      await del.promise;
    });

    await waitFor(() =>
      expect(
        calls.some((call) => call.method === "DELETE" && call.path === "/api/v1/favorites/THYAO"),
      ).toBe(true),
    );
    expect(summaryCalls()).toHaveLength(summaryBefore);
  });

  it("kaldırma başarısızsa geri alır ve hata toast'ı gösterir", async () => {
    favorites = ["THYAO"];
    summaryRows = [company("THYAO", "Türk Hava Yolları", 1.2)];
    deleteResponse = () => mockResponse({ detail: "favorite_failed" }, 500);

    const user = userEvent.setup();
    renderPage(await WatchlistPage());

    expect(await screen.findByText("THYAO")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Kaldır: THYAO" }));

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    expect(await screen.findByText("THYAO")).toBeInTheDocument();
  });

  it("çözülemeyen sembolleri not olarak gösterir (sessizce atmaz)", async () => {
    favorites = ["THYAO", "YOKTUR"];
    summaryRows = [company("THYAO", "Türk Hava Yolları", 1.2)];

    renderPage(await WatchlistPage());

    expect(await screen.findByText("Çözülemeyen semboller: YOKTUR")).toBeInTheDocument();
    expect(screen.getByText("THYAO")).toBeInTheDocument();
  });
});

describe("/watchlist — boş liste", () => {
  it("boş durum + Piyasalara git CTA'sı gösterir, fiyat isteği atmaz (U-13)", async () => {
    favorites = [];

    renderPage(await WatchlistPage());

    expect(screen.getByText("Takip listeniz boş")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Piyasalara git" })).toHaveAttribute(
      "href",
      "/markets",
    );
    expect(summaryCalls()).toHaveLength(0);
  });
});

describe("/watchlist — hata durumları", () => {
  it("summary 429 dönerse nazik hata durumu gösterir (S-11)", async () => {
    favorites = ["THYAO"];
    summaryStatus = 429;

    renderPage(await WatchlistPage());

    expect(
      await screen.findByText("Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar dene."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tekrar dene" })).toBeInTheDocument();
  });

  it("favorites isteği başarısızsa hata durumu gösterir", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const raw =
          typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        const path = new URL(raw, "http://localhost:3000").pathname;
        if (path === "/api/v1/market/status") {
          return mockResponse(statusPayload);
        }
        throw new Error("backend unreachable");
      }),
    );

    renderPage(await WatchlistPage());

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Takip listesi yüklenemedi.")).toBeInTheDocument();
  });
});
