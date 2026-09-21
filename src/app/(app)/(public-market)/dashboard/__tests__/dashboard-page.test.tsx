/**
 * `/dashboard` sayfa testleri (Faz 5B / Birim 5B.1, P-05, U-07, U-13).
 *
 * Sunucu bileşeni doğrudan çağrılır; `global.fetch` mock'lanır ve gerçek `tr`
 * kataloğuyla render edilir. Doğrulananlar:
 *   - portföy özeti toplam değeri ve portföy sayısı,
 *   - takip listesi satırları,
 *   - piyasa nabzı kartları (USD/EUR/gram altın),
 *   - bülten önizlemesi (başlık + sanitize edilmiş gövde),
 *   - boş durumlar ve CTA'ları,
 *   - backend kapalıyken çökme yok.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/(app)/(public-market)/dashboard/page";
import type { Digest } from "@/lib/digest/types";
import { renderWithIntl } from "@/test/test-utils";
import { mockResponse } from "@/test/http";

const { pushMock, sessionMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  // Faz 5C: `/dashboard` artık anonimde guest yer tutucuya düşer. Testler
  // varsayılan olarak oturumlu kullanıcıyı taklit eder; guest senaryosu
  // `sessionMock.value = null` ile kurulur.
  sessionMock: { value: { id: 1 } as unknown },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: () => Promise.resolve(sessionMock.value),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next-intl/server", async () => {
  const messages = (await import("../../../../../../messages/tr.json")).default as Record<
    string,
    unknown
  >;
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

const STATUS = {
  open: true,
  next_open_at: null,
  timezone: "Europe/Istanbul",
  is_holiday: false,
  holiday_name: null,
  as_of: "2026-09-22T08:00:00Z",
};

function digest(overrides: Partial<Digest> = {}): Digest {
  return {
    id: "d1",
    date: "2026-09-22",
    slot: "morning",
    title: "Sabah bülteni",
    content: "Genel görünüm",
    sections: [{ heading: "Özet", body: "[tıkla](javascript:alert(1)) ve normal metin." }],
    metadata: {},
    language: "tr",
    created_at: "2026-09-22T07:00:00Z",
    ...overrides,
  };
}

type Handlers = Record<string, (url: URL) => Response>;

type RecordedCall = { path: string; params: URLSearchParams };

let fetchCalls: RecordedCall[] = [];

function summaryRow(id: string, name: string, value: number, changePct: number) {
  return {
    id,
    name,
    currency: "TRY",
    created_at: "2026-09-01T00:00:00Z",
    current_value: value,
    cost_basis: value,
    daily_change_pct: changePct,
    total_return_pct: 5,
    position_count: 1,
    as_of: STATUS.as_of,
  };
}

function installFetch(handlers: Handlers): void {
  fetchCalls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const raw =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(raw, "http://localhost:7055");
      fetchCalls.push({ path: url.pathname, params: url.searchParams });
      const handler = handlers[url.pathname];
      if (!handler) {
        return mockResponse({ detail: "not found" }, 404);
      }
      return handler(url);
    }),
  );
}

function fullHandlers(): Handlers {
  return {
    "/api/v1/portfolios/summaries": () =>
      mockResponse({
        items: [summaryRow("p1", "Uzun vade", 1000, 1), summaryRow("p2", "Agresif", 2000, -1)],
      }),
    "/api/v1/favorites": () => mockResponse({ favorites: ["THYAO", "ASELS"] }),
    "/api/v1/market/status": () => mockResponse(STATUS),
    "/api/v1/economy/quotes": () =>
      mockResponse({
        ts: STATUS.as_of,
        source: "test",
        quotes: {
          USD: { symbol: "USD", buying: 34.5, selling: 34.6, price: null, change_pct: 0.5, change_text: null, currency: "TRY", unit: "1 unit", source: "test", ts: STATUS.as_of, stale: false, extra: {} },
          EUR: { symbol: "EUR", buying: 38.2, selling: 38.3, price: null, change_pct: -0.2, change_text: null, currency: "TRY", unit: "1 unit", source: "test", ts: STATUS.as_of, stale: false, extra: {} },
          "XAU-GRAM": { symbol: "XAU-GRAM", buying: 2500, selling: 2510, price: null, change_pct: 1.2, change_text: null, currency: "TRY", unit: "1 gram", source: "test", ts: STATUS.as_of, stale: false, extra: {} },
        },
        remaining: null,
      }),
    "/api/v1/digest": () => mockResponse(digest()),
    "/api/v1/companies/summary": () =>
      mockResponse({
        data: [
          { ticker: "THYAO", name: "Türk Hava Yolları", sector: null, last_price: 100, change_pct: 1.2, previous_close: 99, absolute_change: 1, change_window: "last_session_change", market_status: "open", is_stale: false, as_of: STATUS.as_of, previous_close_as_of: null, day_high: null, day_low: null, volume: 1_000_000, market_cap: 1_000_000_000, currency: "TRY", price_updated_at: null },
          { ticker: "ASELS", name: "Aselsan", sector: null, last_price: 50, change_pct: -0.5, previous_close: 50.25, absolute_change: -0.25, change_window: "last_session_change", market_status: "open", is_stale: false, as_of: STATUS.as_of, previous_close_as_of: null, day_high: null, day_low: null, volume: 500_000, market_cap: 500_000_000, currency: "TRY", price_updated_at: null },
        ],
        total: 2,
      }),
  };
}

function emptyHandlers(): Handlers {
  return {
    "/api/v1/portfolios/summaries": () => mockResponse({ items: [] }),
    "/api/v1/favorites": () => mockResponse({ favorites: [] }),
    "/api/v1/market/status": () => mockResponse(STATUS),
    "/api/v1/economy/quotes": () =>
      mockResponse({ ts: STATUS.as_of, source: null, quotes: {}, remaining: null }),
    "/api/v1/digest": () => mockResponse({ detail: "not found" }, 404),
  };
}

async function renderDashboard(): Promise<ReturnType<typeof render>> {
  const ui = (await DashboardPage()) as ReactElement;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  pushMock.mockReset();
  sessionMock.value = { id: 1 };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/dashboard — dolu paket", () => {
  it("portföy özeti, takip listesi, nabız ve bülteni render eder", async () => {
    installFetch(fullHandlers());

    await renderDashboard();

    expect(screen.getByRole("heading", { level: 1, name: "Genel Bakış" })).toBeInTheDocument();

    // Portföy özeti: toplam 3.000,00 + iki satır + sayı.
    expect(screen.getByText("3.000,00")).toBeInTheDocument();
    expect(screen.getByText("Uzun vade")).toBeInTheDocument();
    expect(screen.getByText("Agresif")).toBeInTheDocument();
    expect(screen.getByText("2 portföy")).toBeInTheDocument();

    // Takip listesi satırları.
    expect(screen.getByText("THYAO")).toBeInTheDocument();
    expect(screen.getByText("ASELS")).toBeInTheDocument();

    // Piyasa nabzı kartları.
    expect(screen.getByText("Dolar")).toBeInTheDocument();
    expect(screen.getByText("Euro")).toBeInTheDocument();
    expect(screen.getByText("Gram Altın")).toBeInTheDocument();

    // Bülten başlığı ve önizlemesi.
    expect(screen.getByText("Sabah bülteni")).toBeInTheDocument();
    expect(screen.getByText("tıkla")).toBeInTheDocument();

    // Hızlı işlemler.
    expect(screen.getByRole("link", { name: "Rapor üret" })).toHaveAttribute(
      "href",
      "/research/reports",
    );
  });

  it("bülten önizlemesi tehlikeli bağlantıyı sanitize eder (S-03)", async () => {
    installFetch(fullHandlers());

    const { container } = await renderDashboard();

    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });
});

describe("/dashboard — boş durumlar (U-13)", () => {
  it("anlamlı CTA'lar gösterir; sahte veri üretmez", async () => {
    installFetch(emptyHandlers());

    await renderDashboard();

    expect(screen.getByText("Henüz portföyün yok")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Portföy oluştur" })).toHaveAttribute(
      "href",
      "/portfolio",
    );

    expect(screen.getByText("Takip listeniz boş")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Piyasalara git" })).toHaveAttribute(
      "href",
      "/markets",
    );

    expect(screen.getByText("Fiyat verisi yok.")).toBeInTheDocument();

    expect(screen.getByText("Henüz bülten yok")).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: "Arşive git" })) {
      expect(link).toHaveAttribute("href", "/digest");
    }
  });
});

describe("/dashboard — backend kapalı", () => {
  it("çökmez; hata/boş durumlarıyla render edilir", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("backend unreachable");
      }),
    );

    await renderDashboard();

    expect(screen.getByRole("heading", { level: 1, name: "Genel Bakış" })).toBeInTheDocument();
    expect(await screen.findByText("Portföyler yüklenemedi.")).toBeInTheDocument();
  });
});

describe("/dashboard — anonim guest paneli (5C / X-09)", () => {
  function guestHandlers(rateLimited = false): Handlers {
    return {
      "/api/v1/market/status": () =>
        rateLimited
          ? mockResponse({ detail: "Too many requests" }, 429, { "retry-after": "30" })
          : mockResponse(STATUS),
      "/api/v1/economy/quotes": () =>
        mockResponse({
          ts: STATUS.as_of,
          source: "test",
          quotes: {
            USD: {
              symbol: "USD",
              buying: 34.5,
              selling: 34.6,
              price: null,
              change_pct: 0.5,
              change_text: null,
              currency: "TRY",
              unit: "1 unit",
              source: "test",
              ts: STATUS.as_of,
              stale: false,
              extra: {},
            },
          },
          remaining: null,
        }),
      "/api/v1/companies/summary": (url: URL) => {
        const sort = url.searchParams.get("sort");
        const ticker = sort === "losers" ? "ASELS" : "THYAO";
        return mockResponse({
          data: [
            {
              ticker,
              name: `${ticker} A.Ş.`,
              sector: null,
              last_price: 100,
              change_pct: sort === "losers" ? -1.2 : 1.2,
              previous_close: 99,
              absolute_change: 1,
              change_window: "last_session_change",
              market_status: "open",
              is_stale: false,
              as_of: STATUS.as_of,
              previous_close_as_of: null,
              day_high: null,
              day_low: null,
              volume: 1_000_000,
              market_cap: 1_000_000_000,
              currency: "TRY",
              price_updated_at: null,
            },
          ],
          total: 1,
        });
      },
      "/api/v1/digest": () => mockResponse(digest()),
    };
  }

  it("public uçlara istek atar; kişisel uçlara 0 istek; CTA'lar görünür", async () => {
    sessionMock.value = null;
    installFetch(guestHandlers());

    await renderDashboard();

    // Değer önerisi + CTA'lar.
    expect(screen.getByRole("heading", { level: 1, name: "Piyasa panosu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kayıt ol" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: "Giriş yap" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Piyasalara göz at" })).toHaveAttribute(
      "href",
      "/markets",
    );

    // Gerçek public veri: nabız + yükselen/düşen + bülten.
    expect(screen.getByText("Dolar")).toBeInTheDocument();
    expect(screen.getByText("Yükselenler")).toBeInTheDocument();
    expect(screen.getByText("Düşenler")).toBeInTheDocument();
    expect(screen.getByText("THYAO")).toBeInTheDocument();
    expect(screen.getByText("Sabah bülteni")).toBeInTheDocument();

    const paths = fetchCalls.map((call) => call.path);
    expect(paths).toContain("/api/v1/market/status");
    expect(paths).toContain("/api/v1/economy/quotes");
    expect(paths).toContain("/api/v1/digest");
    // Yükselen + düşen için tam iki ayrı istek.
    expect(paths.filter((path) => path === "/api/v1/companies/summary")).toHaveLength(2);

    // Kişisel uçlara HİÇ istek yok.
    for (const personal of [
      "/api/v1/favorites",
      "/api/v1/portfolios/summaries",
      "/api/v1/credits",
      "/api/v1/profile",
    ]) {
      expect(paths).not.toContain(personal);
    }
  });

  it("429'da uyarı gösterir; çökmez", async () => {
    sessionMock.value = null;
    installFetch(guestHandlers(true));

    await renderDashboard();

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Çok fazla istek gönderildi")).toBeInTheDocument();
    expect(screen.getByText("30 saniye sonra tekrar dene.")).toBeInTheDocument();
  });
});
