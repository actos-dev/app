/**
 * `/portfolio` liste sayfası testleri (Faz 4 / Birim 4.1, B-10, P-02, S-11).
 *
 * Sayfa sunucu bileşenidir; `global.fetch` mock'lanır ve gerçek `tr`
 * kataloğuyla render edilir. Doğrulananlar:
 *   - summaries mutlu yolunda TEK liste isteği (portföy başına istek yok),
 *   - summaries 404/502 → `/portfolios` fallback'i; değerleme "—", çökme yok,
 *   - tüm uçlar kapalıyken `ErrorState`,
 *   - boş durum CTA'sı, oluşturma doğrulaması + invalidate, silme onayı.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PortfolioPage from "@/app/(app)/(private)/portfolio/page";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
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

/** Sayfa, `MarketStatusPill` ve `PortfolioList` (React Query) render eder. */
function renderPage(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const statusPayload = {
  open: true,
  next_open_at: null,
  timezone: "Europe/Istanbul",
  is_holiday: false,
  holiday_name: null,
  as_of: "2026-09-21T08:00:00Z",
};

const summaryItems = [
  {
    id: "port-1",
    name: "Uzun Vade",
    currency: "TRY",
    created_at: "2026-08-01T08:00:00Z",
    current_value: 125000.5,
    cost_basis: 100000,
    daily_change_pct: 1.25,
    total_return_pct: 25,
    position_count: 3,
    as_of: "2026-09-21T08:00:00Z",
  },
  {
    id: "port-2",
    name: "Kısa Vade",
    currency: "TRY",
    created_at: "2026-08-10T08:00:00Z",
    current_value: 50000,
    cost_basis: 50000,
    daily_change_pct: -0.5,
    total_return_pct: 0,
    position_count: 0,
    as_of: "2026-09-21T08:00:00Z",
  },
];

const summariesPayload = { items: summaryItems };

/** Fallback ham listesi (backend `Portfolio` modeli). */
const portfoliosPayload = summaryItems.map((item) => ({
  metadata: {
    id: item.id,
    user_id: 1,
    name: item.name,
    initial_balance: 100000,
    balance: 100000,
    created_at: item.created_at,
    updated_at: item.created_at,
  },
  transactions: [],
}));

type FetchCall = { url: string; path: string; method: string };

let calls: FetchCall[] = [];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function installFetch(handler: (path: string, method: string) => Response | null) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const raw =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(raw, "http://localhost").pathname;
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ url: raw, path, method });
      const response = handler(path, method);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

/** Belirli bir yolun çağrı sayısı. */
function countPath(path: string): number {
  return calls.filter((call) => call.path === path).length;
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/portfolio — summaries mutlu yolu", () => {
  it("tek summaries isteği atar ve kart değerlerini gösterir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/portfolios/summaries") return jsonResponse(summariesPayload);
      return null;
    });

    renderPage(await PortfolioPage());

    expect(screen.getByText("Uzun Vade")).toBeInTheDocument();
    expect(screen.getByText("125.000,50")).toBeInTheDocument();
    expect(screen.getByText("+1,25%")).toBeInTheDocument();
    expect(screen.getByText("+25,00%")).toBeInTheDocument();
    expect(screen.getByText("3 pozisyon")).toBeInTheDocument();
    expect(screen.getAllByText(/Veri zamanı:/).length).toBe(2);

    // Yalnızca RSC çağrıları: summaries + market/status. Portföy başına istek yok.
    expect(calls.map((call) => call.path).sort()).toEqual([
      "/api/v1/market/status",
      "/api/v1/portfolios/summaries",
    ]);
    expect(countPath("/api/v1/portfolios/summaries")).toBe(1);
    expect(countPath("/api/v1/portfolios")).toBe(0);
  });

  it("N+1 yok: kart sayısı portföy başına ek istek üretmez", async () => {
    const handler = (items: typeof summaryItems) => (path: string) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/portfolios/summaries") return jsonResponse({ items });
      return null;
    };

    installFetch(handler(summaryItems.slice(0, 1)));
    await PortfolioPage();
    const oneItemRequests = countPath("/api/v1/portfolios/summaries");

    installFetch(handler(summaryItems));
    await PortfolioPage();
    const twoItemRequests = countPath("/api/v1/portfolios/summaries");

    console.log(
      `[portfolio] summaries istek sayısı: 1 kart=${oneItemRequests}, 2 kart=${twoItemRequests}`,
    );
    expect(oneItemRequests).toBe(1);
    expect(twoItemRequests).toBe(1);
  });

  it("boş listede boş durum ve CTA gösterir; CTA diyaloğu açar", async () => {
    const user = userEvent.setup();
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/portfolios/summaries") return jsonResponse({ items: [] });
      return null;
    });

    renderPage(await PortfolioPage());

    expect(screen.getByText("Henüz portföyün yok")).toBeInTheDocument();
    const cta = screen.getByRole("button", { name: "Yeni portföy oluştur" });
    expect(cta).toBeInTheDocument();

    await user.click(cta);
    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Yeni portföy");
  });
});

describe("/portfolio — summaries fallback", () => {
  it("summaries 404 dönerse /portfolios listesiyle gösterir, değerler '—', çökmez", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/portfolios/summaries") {
        return jsonResponse({ detail: "error_not_found" }, 404);
      }
      if (path === "/api/v1/portfolios") return jsonResponse(portfoliosPayload);
      return null;
    });

    renderPage(await PortfolioPage());

    expect(screen.getByText("Uzun Vade")).toBeInTheDocument();
    expect(screen.getByText("Kısa Vade")).toBeInTheDocument();
    // Değerleme alanları yok: her kartta "—" ve bilinmeyen veri zamanı.
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByText("Veri zamanı bilinmiyor").length).toBe(2);
    expect(screen.getByRole("status")).toHaveTextContent("Portföy özetleri");

    // Tek fallback isteği; portföy başına ek istek yok.
    expect(countPath("/api/v1/portfolios/summaries")).toBe(1);
    expect(countPath("/api/v1/portfolios")).toBe(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("summaries 502 dönerse de fallback'e düşer", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/portfolios/summaries") {
        return jsonResponse({ detail: "error_backend_unreachable" }, 502);
      }
      if (path === "/api/v1/portfolios") return jsonResponse(portfoliosPayload);
      return null;
    });

    renderPage(await PortfolioPage());

    expect(screen.getByText("Uzun Vade")).toBeInTheDocument();
    expect(countPath("/api/v1/portfolios")).toBe(1);
  });

  it("tüm portföy uçları başarısızsa ErrorState gösterir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      return null;
    });

    renderPage(await PortfolioPage());

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("Portföyler yüklenemedi")).toBeInTheDocument();
  });
});

describe("/portfolio — yazma akışları", () => {
  it("oluşturma diyaloğu boş formu doğrular, başarıda listeyi tazeler", async () => {
    const user = userEvent.setup();
    installFetch((path, method) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/portfolios/summaries") return jsonResponse(summariesPayload);
      if (path === "/api/v1/portfolios" && method === "POST") {
        return jsonResponse({ metadata: { id: "port-3" }, transactions: [] });
      }
      return null;
    });

    renderPage(await PortfolioPage());

    await user.click(screen.getByRole("button", { name: "Yeni portföy" }));
    await user.click(screen.getByRole("button", { name: "Oluştur" }));

    // Doğrulama: istek atılmadı.
    expect(screen.getByText("Portföy adı gerekli.")).toBeInTheDocument();
    expect(screen.getByText("Başlangıç bakiyesi gerekli.")).toBeInTheDocument();
    expect(calls.some((call) => call.method === "POST")).toBe(false);

    await user.type(screen.getByLabelText("Portföy adı"), "Emeklilik");
    await user.type(screen.getByLabelText("Başlangıç bakiyesi"), "100000");
    await user.click(screen.getByRole("button", { name: "Oluştur" }));

    await waitFor(() => {
      expect(calls.some((call) => call.method === "POST" && call.path === "/api/v1/portfolios")).toBe(
        true,
      );
    });
    // Başarıda invalidation: summaries yeniden çekilir.
    await waitFor(() => {
      expect(countPath("/api/v1/portfolios/summaries")).toBeGreaterThanOrEqual(2);
    });
  });

  it("silme işlemi onay diyaloğu ister ve onayda DELETE atar", async () => {
    const user = userEvent.setup();
    installFetch((path, method) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/portfolios/summaries") return jsonResponse(summariesPayload);
      if (path === "/api/v1/portfolios/port-1" && method === "DELETE") {
        return jsonResponse({ message: "Portfolio deleted" });
      }
      return null;
    });

    renderPage(await PortfolioPage());

    await user.click(screen.getByRole("button", { name: "Uzun Vade portföyünü sil" }));
    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Portföyü sil");

    await user.click(screen.getByRole("button", { name: "Sil" }));

    await waitFor(() => {
      expect(
        calls.some(
          (call) => call.method === "DELETE" && call.path === "/api/v1/portfolios/port-1",
        ),
      ).toBe(true);
    });
  });
});
