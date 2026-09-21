/**
 * `/portfolio/[id]` detay sayfası testleri (Faz 4 / Birim 4.2, B-07, B-10, S-15).
 *
 * Sayfa sunucu bileşenidir; `global.fetch` mock'lanır, istemci ağacı gerçek
 * `tr` kataloğuyla render edilir. Doğrulananlar:
 *   - RSC verisiyle özet + pozisyon + işlem tablosu,
 *   - portföy başına SABİT istek sayısı (pozisyon başına istek / N+1 yok),
 *   - 404 → `notFound()`.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import PortfolioDetailPage from "@/app/(app)/portfolio/[id]/page";
import { renderWithIntl } from "@/test/test-utils";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
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

// jsdom öğe boyutlarını 0 döndürür; sanallaştırıcı satırları çizebilsin diye.
const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

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

const portfolioPayload = {
  metadata: {
    id: "port-1",
    user_id: 1,
    name: "Uzun Vade",
    initial_balance: 5000,
    balance: 2000,
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-09-21T08:00:00Z",
  },
  transactions: [],
};

const valuationPayload = {
  total_value: 6000,
  cash_balance: 2000,
  holdings_value: 4000,
  total_pnl: 1000,
  pnl_percentage: 20,
  assets: [
    {
      ticker: "THYAO",
      amount: 10,
      current_price: 400,
      total_value: 4000,
      total_cost: 3000,
      weighted_avg_cost: 300,
      unrealized_pnl: 1000,
      unrealized_pnl_pct: 33.33,
    },
  ],
};

const transactionsPayload = [
  {
    id: "tx-1",
    ticker: "THYAO",
    type: "BUY",
    quantity: 10,
    price: 300,
    commission: 3,
    total: 3003,
    date: "2026-08-15T08:00:00Z",
  },
];

const summariesPayload = {
  items: [
    {
      id: "port-1",
      name: "Uzun Vade",
      currency: "TRY",
      created_at: "2026-08-01T08:00:00Z",
      current_value: 6000,
      cost_basis: 5000,
      daily_change_pct: 1.5,
      total_return_pct: 20,
      position_count: 1,
      as_of: "2026-09-21T08:00:00Z",
    },
  ],
};

type FetchCall = { path: string; method: string };

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
      calls.push({ path, method });
      const response = handler(path, method);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

function countPath(path: string): number {
  return calls.filter((call) => call.path === path).length;
}

/** Sayfa, `PortfolioDetail` (React Query) render eder. */
function renderPage(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function happyHandler(path: string, method: string): Response | null {
  if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
  if (path === "/api/v1/portfolios/port-1") return jsonResponse(portfolioPayload);
  if (path === "/api/v1/portfolios/port-1/valuation") return jsonResponse(valuationPayload);
  if (path === "/api/v1/portfolios/port-1/transactions" && method === "GET") {
    return jsonResponse(transactionsPayload);
  }
  if (path === "/api/v1/portfolios/summaries") return jsonResponse(summariesPayload);
  if (path === "/api/v1/price/current") {
    return jsonResponse({
      ticker: "THYAO",
      price: 400,
      previous_close: 395,
      absolute_change: 5,
      change_pct: 1.27,
      as_of: "2026-09-21T08:00:00Z",
      previous_close_as_of: null,
      market_status: "open",
      is_stale: false,
      change_window: "last_session_change",
      interval: "5m",
    });
  }
  return null;
}

const pageProps = {
  params: Promise.resolve({ id: "port-1" }),
  searchParams: Promise.resolve({}),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/portfolio/[id] — RSC detayı", () => {
  it("özet başlık, pozisyon ve işlem tablosunu RSC verisiyle çizer", async () => {
    installFetch(happyHandler);

    renderPage(await PortfolioDetailPage(pageProps));

    expect(screen.getByRole("heading", { name: "Uzun Vade", level: 1 })).toBeInTheDocument();
    // Güncel değer + maliyet + nakit.
    expect(screen.getByText("6.000,00")).toBeInTheDocument();
    expect(screen.getByText("5.000,00")).toBeInTheDocument();
    expect(screen.getByText("2.000,00")).toBeInTheDocument();
    // Toplam getiri ve günlük değişim (Delta).
    expect(screen.getByText("+20,00%")).toBeInTheDocument();
    expect(screen.getByText("+1,50%")).toBeInTheDocument();
    // Pozisyon ve işlem satırları aynı sembolü taşır.
    expect(screen.getAllByText("THYAO").length).toBeGreaterThanOrEqual(2);
  });

  it("portföy başına sabit istek atar; pozisyon başına fiyat isteği YOK", async () => {
    installFetch(happyHandler);

    renderPage(await PortfolioDetailPage(pageProps));

    const paths = calls.map((call) => call.path).sort();
    expect(paths).toEqual([
      "/api/v1/market/status",
      "/api/v1/portfolios/port-1",
      "/api/v1/portfolios/port-1/transactions",
      "/api/v1/portfolios/port-1/valuation",
      "/api/v1/portfolios/summaries",
    ]);
    expect(countPath("/api/v1/price/current")).toBe(0);
    expect(countPath("/api/v1/economy/quotes")).toBe(0);
  });

  it("pozisyondan alış açılınca YALNIZ tek fiyat isteği atar", async () => {
    const user = userEvent.setup();
    installFetch(happyHandler);

    renderPage(await PortfolioDetailPage(pageProps));

    // Sayfa ilk açılışta (diyalog kapalı, sembol yok) hiç fiyat istemez.
    expect(countPath("/api/v1/price/current")).toBe(0);

    const tradeButton = screen.getAllByRole("button", { name: "Alış" })[0];
    await user.click(tradeButton!);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await waitFor(() => expect(countPath("/api/v1/price/current")).toBe(1));
  });

  it("404'te notFound() çağırır", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      return jsonResponse({ detail: "error_portfolio_not_found" }, 404);
    });

    await expect(PortfolioDetailPage(pageProps)).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
