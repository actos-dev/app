/**
 * Fiyat grafiği testleri (Faz 3 / Birim 3.3, D-06, P-12).
 *
 * `lightweight-charts` jsdom'da mock'lanır; doğrulananlar:
 *   - doğru endpoint'in çağrıldığı (BIST vs economy),
 *   - serinin veriyle doldurulduğu,
 *   - unmount'ta grafiğin dispose edildiği (`remove()`).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PriceChart } from "@/components/market/PriceChart";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

const seriesMock = {
  setData: vi.fn(),
  applyOptions: vi.fn(),
};

const chartMock = {
  addSeries: vi.fn(() => ({ ...seriesMock, setData: vi.fn() })),
  removeSeries: vi.fn(),
  applyOptions: vi.fn(),
  resize: vi.fn(),
  remove: vi.fn(),
  timeScale: () => ({ fitContent: vi.fn() }),
};

vi.mock("lightweight-charts", () => ({
  createChart: vi.fn(() => chartMock),
  AreaSeries: { type: "Area" },
  CandlestickSeries: { type: "Candlestick" },
  ColorType: { Solid: "solid" },
  LineStyle: { Solid: 0 },
}));

function withQueryClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const candlePayload = [
  { ts: "2026-09-01T00:00:00Z", open: 10, high: 12, low: 9, close: 11, volume: 100 },
  { ts: "2026-09-02T00:00:00Z", open: 11, high: 13, low: 10, close: 12, volume: 120 },
];

let paths: string[] = [];

function installFetch(body: unknown = candlePayload) {
  paths = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      paths.push(new URL(url, "http://localhost:3000").pathname);
      return mockResponse(body);
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  document.documentElement.removeAttribute("data-theme");
});

describe("PriceChart", () => {
  it("BIST için /price/history ucunu çağırır ve seriyi doldurur", async () => {
    installFetch();

    withQueryClient(
      <PriceChart symbol="THYAO" kind="bist" period="1mo" onPeriodChange={vi.fn()} />,
    );

    await waitFor(() => expect(chartMock.addSeries).toHaveBeenCalled());
    expect(paths).toContain("/api/v1/price/history/THYAO");
    expect(screen.getByText(/THYAO/)).toBeInTheDocument();
  });

  it("economy için /economy/history ucunu çağırır", async () => {
    installFetch();

    withQueryClient(
      <PriceChart symbol="XAU-GRAM" kind="economy" period="1y" onPeriodChange={vi.fn()} />,
    );

    await waitFor(() => expect(paths.length).toBeGreaterThan(0));
    expect(paths).toContain("/api/v1/economy/history/XAU-GRAM");
  });

  it("tema (data-theme) değişiminde grafiği yeniden renklendirir", async () => {
    installFetch();

    withQueryClient(
      <PriceChart symbol="THYAO" kind="bist" period="1mo" onPeriodChange={vi.fn()} />,
    );

    await waitFor(() => expect(chartMock.addSeries).toHaveBeenCalled());
    vi.mocked(chartMock.applyOptions).mockClear();

    document.documentElement.setAttribute("data-theme", "light");

    await waitFor(() => expect(chartMock.applyOptions).toHaveBeenCalled());
  });

  it("unmount'ta grafiği dispose eder (remove)", async () => {
    installFetch();

    const { unmount } = withQueryClient(
      <PriceChart symbol="THYAO" kind="bist" period="1mo" onPeriodChange={vi.fn()} />,
    );

    await waitFor(() => expect(chartMock.addSeries).toHaveBeenCalled());
    unmount();
    expect(chartMock.remove).toHaveBeenCalledTimes(1);
  });

  it("periyot butonu onPeriodChange'i tetikler", async () => {
    installFetch();
    const onPeriodChange = vi.fn();

    withQueryClient(
      <PriceChart symbol="THYAO" kind="bist" period="1mo" onPeriodChange={onPeriodChange} />,
    );

    const button = await screen.findByRole("button", { name: "1Y" });
    button.click();
    expect(onPeriodChange).toHaveBeenCalledWith("1y");
  });
});
