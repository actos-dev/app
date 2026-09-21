/**
 * `/symbol/[symbol]` sayfa testleri (Faz 3 / Birim 3.3).
 *
 * Sunucu bileşeni doğrudan çağrılır; `global.fetch` mock'lanır. Doğrulananlar:
 *   - BIST'te doğru uçların çağrıldığı ve çerez yolunun kullanıldığı,
 *   - economy'de yalnız `/economy/quotes`'un çağrıldığı,
 *   - haber sekmesinin boş durumu gösterdiği,
 *   - bilinmeyen BIST sembolünün `notFound()` ile 404'e dönüştüğü.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SymbolPage, {
  generateMetadata,
} from "@/app/(app)/(public-market)/symbol/[symbol]/page";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("next-intl/server", async () => {
  const messages = (await import("../../../../../../../messages/tr.json")).default as Record<
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
    getLocale: () => Promise.resolve("tr"),
  };
});

const profilePayload = {
  symbol: "THYAO",
  name: "Türk Hava Yolları",
  sector: "Ulaştırma",
  industry: "Havayolu",
  currency: "TRY",
  exchange: "IST",
  market: {
    currentPrice: 312.5,
    previousClose: 310,
    marketCap: 430_000_000_000,
    dayHigh: 315,
    dayLow: 308,
    regularMarketVolume: 12_000_000,
    fiftyTwoWeekHigh: 350,
    fiftyTwoWeekLow: 210,
    regularMarketTime: 1_789_000_000,
  },
  trading: { beta: 1.1, sharesOutstanding: 1_380_000_000, floatShares: null, averageVolume: 10_000_000, averageVolume10days: null, fiftyDayAverage: 305, twoHundredDayAverage: 280, shortRatio: null, heldPercentInsiders: 0.01, heldPercentInstitutions: 0.45 },
  valuation: { trailingPE: 8.2, forwardPE: 7.1, pegRatio: null, priceToBook: 1.4, priceToSalesTrailing12Months: 0.8, enterpriseValue: null, enterpriseToEbitda: null, enterpriseToRevenue: null, bookValue: null, trailingEps: 38, forwardEps: null, dividendYield: 0.03, payoutRatio: null, targetMeanPrice: 380, targetHighPrice: 420, targetLowPrice: 300, recommendationKey: "buy", numberOfAnalystOpinions: 18 },
  financials: { totalRevenue: 500_000_000_000, revenuePerShare: null, revenueGrowth: 0.12, grossProfits: null, grossMargins: 0.25, ebitda: 90_000_000_000, ebitdaMargins: null, netIncomeToCommon: 40_000_000_000, profitMargins: 0.08, operatingMargins: null, operatingCashflow: null, freeCashflow: null, earningsGrowth: null, earningsQuarterlyGrowth: null, returnOnEquity: 0.3, returnOnAssets: null },
  balanceSheet: { totalCash: 100_000_000_000, totalCashPerShare: null, totalDebt: 200_000_000_000, debtToEquity: 120, currentRatio: 0.9, quickRatio: 0.8 },
  recommendations: [],
};

const summaryPayload = {
  data: [
    {
      ticker: "THYAO",
      name: "Türk Hava Yolları",
      sector: "Ulaştırma",
      last_price: 312.5,
      change_pct: 0.81,
      previous_close: 310,
      absolute_change: 2.5,
      change_window: "last_session_change",
      market_status: "open",
      is_stale: false,
      as_of: "2026-09-21T08:00:00Z",
      previous_close_as_of: "2026-09-20T15:00:00Z",
      day_high: 315,
      day_low: 308,
      volume: 12_000_000,
      market_cap: 430_000_000_000,
      currency: "TRY",
      price_updated_at: "2026-09-21T08:00:00Z",
    },
  ],
  total: 1,
};

const statusPayload = {
  open: true,
  next_open_at: null,
  timezone: "Europe/Istanbul",
  is_holiday: false,
  holiday_name: null,
  as_of: "2026-09-21T08:00:00Z",
};

const quotesPayload = {
  ts: "2026-09-21T08:00:00Z",
  source: "genelpara",
  quotes: {
    USD: {
      symbol: "USD",
      buying: 41.2,
      selling: 41.3,
      price: 41.25,
      change_pct: 0.12,
      change_text: null,
      currency: "TRY",
      unit: "1 unit",
      source: "genelpara",
      ts: "2026-09-21T08:00:00Z",
      stale: false,
      extra: {},
    },
  },
  remaining: null,
};

type FetchCall = { method: string; path: string; url: string };

let calls: FetchCall[] = [];

function installFetch(handler: (method: string, path: string) => Response | null) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(url, "http://localhost:3000").pathname;
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ method, path, url });
      const response = handler(method, path);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

function bistHandler(method: string, path: string): Response | null {
  if (path === "/api/v1/companies/info/THYAO") return mockResponse(profilePayload);
  if (path === "/api/v1/companies/summary") return mockResponse(summaryPayload);
  if (path === "/api/v1/news/THYAO") return mockResponse([]);
  if (path === "/api/v1/market/status") return mockResponse(statusPayload);
  if (path === "/api/v1/favorites") return mockResponse({ favorites: ["THYAO"] });
  return null;
}

function renderPage(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/symbol/[symbol] — BIST", () => {
  it("companies/info, summary ve news uçlarını çeker", async () => {
    installFetch(bistHandler);

    renderPage(
      await SymbolPage({
        params: Promise.resolve({ symbol: "THYAO" }),
        searchParams: Promise.resolve({}),
      }),
    );

    const serverPaths = calls.map((call) => call.path);
    expect(serverPaths).toContain("/api/v1/companies/info/THYAO");
    expect(serverPaths).toContain("/api/v1/companies/summary");
    expect(serverPaths).toContain("/api/v1/news/THYAO");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("THYAO");
    expect(screen.getByText("Türk Hava Yolları")).toBeInTheDocument();
  });

  it("haber sekmesi boş durumu gösterir", async () => {
    installFetch(bistHandler);
    const user = userEvent.setup();

    renderPage(
      await SymbolPage({
        params: Promise.resolve({ symbol: "THYAO" }),
        searchParams: Promise.resolve({}),
      }),
    );

    await user.click(screen.getByRole("tab", { name: "Haberler" }));
    expect(await screen.findByText("Bu hisse için haber bulunamadı.")).toBeInTheDocument();
  });

  it("bilinmeyen sembolde notFound() fırlatır", async () => {
    installFetch((method, path) => {
      if (path === "/api/v1/companies/info/BILINMEYEN") return mockResponse({ detail: "Invalid" }, 404);
      if (path === "/api/v1/market/status") return mockResponse(statusPayload);
      return null;
    });

    await expect(
      SymbolPage({
        params: Promise.resolve({ symbol: "BILINMEYEN" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("/symbol/[symbol] — anonim (5C / X-04)", () => {
  it("favori isteği ATMAZ; giriş düğmesi ve login'e giden portföy CTA'sı gösterir", async () => {
    installFetch(bistHandler);

    const ui = await SymbolPage({
      params: Promise.resolve({ symbol: "THYAO" }),
      searchParams: Promise.resolve({}),
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
    });
    renderWithIntl(
      <QueryClientProvider client={client}>
        <SessionProvider session={{ authenticated: false }}>{ui}</SessionProvider>
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Takibe almak için giriş yap" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Portföyde işlem yap/ })).toHaveAttribute(
      "href",
      "/login?next=%2Fportfolio",
    );
    // Anonimde `/favorites` (kişisel uç) çağrılmaz.
    expect(calls.some((call) => call.path === "/api/v1/favorites")).toBe(false);
  });
});

describe("/symbol/[symbol] — economy", () => {
  it("yalnız economy/quotes ucunu çağırır, companies ucunu çağırmaz", async () => {
    installFetch((method, path) => {
      if (path === "/api/v1/economy/quotes") return mockResponse(quotesPayload);
      if (path === "/api/v1/market/status") return mockResponse(statusPayload);
      if (path === "/api/v1/favorites") return mockResponse({ favorites: [] });
      return null;
    });

    renderPage(
      await SymbolPage({
        params: Promise.resolve({ symbol: "usd" }),
        searchParams: Promise.resolve({ period: "1y" }),
      }),
    );

    const quoteCall = calls.find((call) => call.path === "/api/v1/economy/quotes");
    expect(quoteCall).toBeDefined();
    expect(new URL(quoteCall!.url).searchParams.get("symbols")).toBe("USD");
    expect(calls.some((call) => call.path.startsWith("/api/v1/companies/"))).toBe(false);
    expect(calls.some((call) => call.path.startsWith("/api/v1/news/"))).toBe(false);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("USD");
  });
});

describe("/symbol/[symbol] — SEO (5C / X-06)", () => {
  it("metadata isim/kod içerir; canlı fiyat İÇERMEZ; canonical sembole bağlanır", async () => {
    installFetch(bistHandler);

    const metadata = await generateMetadata({
      params: Promise.resolve({ symbol: "thyao" }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata.title).toBe("Türk Hava Yolları");
    expect(metadata.alternates?.canonical).toBe("/symbol/THYAO");

    const description = String(metadata.description ?? "");
    expect(description).toContain("THYAO");
    // Canlı alan (fiyat) metadata'ya KONMAZ; crawl edilen içerik stabil kalır.
    expect(description).not.toContain("312,5");
    expect(description).not.toContain("312.5");
  });

  it("BreadcrumbList JSON-LD yerleştirir (dangerouslySetInnerHTML yok)", async () => {
    installFetch(bistHandler);

    const { container } = renderPage(
      await SymbolPage({
        params: Promise.resolve({ symbol: "THYAO" }),
        searchParams: Promise.resolve({}),
      }),
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const data = JSON.parse(script?.textContent ?? "{}") as {
      "@type": string;
      itemListElement: Array<{ item: string }>;
    };
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toHaveLength(2);
    expect(data.itemListElement[1]?.item).toContain("/symbol/THYAO");
  });
});
