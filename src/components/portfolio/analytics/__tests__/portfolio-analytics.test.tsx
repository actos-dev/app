/**
 * Portföy analiz sekmeleri testleri (Faz 4 / Birim 4.3).
 *
 * Doğrulananlar:
 *   - sekme kapalıyken analiz uçlarına İSTEK YOK (tembel mount),
 *   - her sekme yalnız kendi uçlarını çağırır,
 *   - Getiri/Risk sayı biçimleri ve boş kıyas durumu,
 *   - dağılımın `sr-only` tablo erişilebilir alternatifi,
 *   - Geçmiş grafiğinin client-only (`ssr: false`) yüklenmesi.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PortfolioAnalytics } from "@/components/portfolio/analytics/PortfolioAnalytics";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

const dynamicMock = vi.hoisted(() => ({ options: [] as Array<Record<string, unknown>> }));

vi.mock("next/dynamic", () => ({
  default: (_loader: unknown, options: Record<string, unknown>) => {
    dynamicMock.options.push(options);
    return function DynamicStub() {
      return <div data-testid="portfolio-value-chart" />;
    };
  },
}));

const PORTFOLIO_ID = "port-1";

const payloads: Record<string, unknown> = {
  returns: {
    period: "1mo",
    start_value: 5000,
    end_value: 6000,
    absolute_return: 1000,
    total_return_percentage: 20,
    cagr_percentage: 15.5,
  },
  performance: {
    overall: { efficiency_score: 0.5, actual_pnl: 1000, optimal_pnl: 2000 },
    assets: [],
  },
  benchmark: {
    portfolio_return_pct: 20,
    benchmark_ticker: "XU100",
    benchmark_return_pct: 10,
    difference_pct: 10,
    outperformed: true,
  },
  diversification: {
    total_value: 8000,
    cash_balance: 2000,
    cash_allocation_pct: 25,
    allocation_by_type: { stock: 4000, forex: 2000 },
    assets: [
      { ticker: "THYAO", amount: 10, value: 4000, type: "stock", allocation_pct: 50 },
      { ticker: "USDTRY", amount: 100, value: 2000, type: "forex", allocation_pct: 25 },
    ],
  },
  risk: { volatility: 1.5, max_drawdown: 10, sharpe_ratio: 0.8 },
  performers: {
    best: [{ ticker: "THYAO", amount: 10, pnl: 1000, pnl_percentage: 33.3 }],
    worst: [{ ticker: "EREGL", amount: 5, pnl: -200, pnl_percentage: -10 }],
  },
  history: [
    { ts: "2026-08-01T00:00:00Z", total_value: 5000, cash_balance: 2000, holdings_value: 3000 },
    { ts: "2026-09-01T00:00:00Z", total_value: 6000, cash_balance: 2000, holdings_value: 4000 },
  ],
};

let paths: string[] = [];

function installFetch(overrides: Partial<typeof payloads> = {}) {
  paths = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(url, "http://localhost").pathname;
      paths.push(path);
      const key = path.split("/").pop() ?? "";
      const body = overrides[key as keyof typeof payloads] ?? payloads[key];
      return mockResponse(body ?? {});
    }),
  );
}

function renderAnalytics(overrides: Partial<typeof payloads> = {}) {
  installFetch(overrides);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  const ui: ReactElement = <PortfolioAnalytics portfolioId={PORTFOLIO_ID} />;
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PortfolioAnalytics", () => {
  it("hiçbir sekme açılmadan analiz uçlarına istek atmaz", async () => {
    renderAnalytics();

    await screen.findByRole("tab", { name: "Getiri" });
    expect(paths).toHaveLength(0);
  });

  it("Getiri sekmesi yalnız returns/performance/benchmark çağırır ve sayıları biçimler", async () => {
    const user = userEvent.setup();
    renderAnalytics();

    await user.click(screen.getByRole("tab", { name: "Getiri" }));

    await waitFor(() => expect(paths).toContain(`/api/v1/portfolios/${PORTFOLIO_ID}/returns`));
    // Tam olarak 3 istek: returns + performance + benchmark (başka uç yok).
    expect([...paths].sort()).toEqual(
      [
        `/api/v1/portfolios/${PORTFOLIO_ID}/returns`,
        `/api/v1/portfolios/${PORTFOLIO_ID}/performance`,
        `/api/v1/portfolios/${PORTFOLIO_ID}/benchmark`,
      ].sort(),
    );

    // Aynı değer portföy getirisi ve kıyasta da geçebilir; en az bir kez görünmeli.
    expect((await screen.findAllByText("+20,00%")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("+1.000,00").length).toBeGreaterThan(0);
  });

  it("kıyas verisi yoksa zarif boş durum gösterir", async () => {
    const user = userEvent.setup();
    renderAnalytics({ benchmark: {} });

    await user.click(screen.getByRole("tab", { name: "Getiri" }));

    expect(await screen.findByText("Kıyas verisi yok")).toBeInTheDocument();
  });

  it("Risk sekmesi risk ucunu çağırır ve sayıları yüzde/oran biçimler", async () => {
    const user = userEvent.setup();
    renderAnalytics();

    await user.click(screen.getByRole("tab", { name: "Risk" }));

    await waitFor(() => expect(paths).toContain(`/api/v1/portfolios/${PORTFOLIO_ID}/risk`));
    expect(paths).toEqual([`/api/v1/portfolios/${PORTFOLIO_ID}/risk`]);

    expect(await screen.findByText("1,50")).toBeInTheDocument();
    expect(screen.getByText("10,00")).toBeInTheDocument();
    expect(screen.getByText("0,80")).toBeInTheDocument();
  });

  it("Dağılım sekmesi erişilebilir tablo alternatifiyle çizilir", async () => {
    const user = userEvent.setup();
    renderAnalytics();

    await user.click(screen.getByRole("tab", { name: "Dağılım" }));

    await waitFor(() =>
      expect(paths).toContain(`/api/v1/portfolios/${PORTFOLIO_ID}/diversification`),
    );
    expect(paths).toEqual([`/api/v1/portfolios/${PORTFOLIO_ID}/diversification`]);
    const table = await screen.findByRole("table", {
      name: "Varlık sınıfı dağılımı tablosu",
    });
    expect(within(table).getByText("Hisse")).toBeInTheDocument();
    expect(within(table).getByText("Döviz")).toBeInTheDocument();
    expect(within(table).getByText("Nakit")).toBeInTheDocument();
  });

  it("Öne çıkanlar sekmesi sembolleri /symbol bağlantısı yapar", async () => {
    const user = userEvent.setup();
    renderAnalytics();

    await user.click(screen.getByRole("tab", { name: "Öne çıkanlar" }));

    await waitFor(() =>
      expect(paths).toContain(`/api/v1/portfolios/${PORTFOLIO_ID}/performers`),
    );
    expect(paths).toEqual([`/api/v1/portfolios/${PORTFOLIO_ID}/performers`]);
    const link = await screen.findByRole("link", { name: "THYAO" });
    expect(link).toHaveAttribute("href", "/symbol/THYAO");
  });

  it("Geçmiş sekmesi history ucunu çağırır ve grafiği client-only yükler", async () => {
    const user = userEvent.setup();
    renderAnalytics();

    await user.click(screen.getByRole("tab", { name: "Geçmiş" }));

    await waitFor(() => expect(paths).toContain(`/api/v1/portfolios/${PORTFOLIO_ID}/history`));
    expect(await screen.findByTestId("portfolio-value-chart")).toBeInTheDocument();
    expect(dynamicMock.options.some((options) => options.ssr === false)).toBe(true);
    expect(paths).toEqual([`/api/v1/portfolios/${PORTFOLIO_ID}/history`]);
  });
});
