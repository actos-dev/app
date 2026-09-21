/**
 * Portföy değeri grafiği testleri (Faz 4 / Birim 4.3, D-06, P-12).
 *
 * `lightweight-charts` jsdom'da mock'lanır; doğrulananlar:
 *   - serinin noktalarla doldurulduğu,
 *   - erişilebilir grafik adının üretildiği,
 *   - periyot butonunun geri bildirim verdiği,
 *   - unmount'ta grafiğin dispose edildiği (`remove()`).
 */
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PortfolioValueChart } from "@/components/portfolio/PortfolioValueChart";
import { renderWithIntl } from "@/test/test-utils";

const seriesMock = { setData: vi.fn() };

const chartMock = {
  addSeries: vi.fn(() => seriesMock),
  removeSeries: vi.fn(),
  applyOptions: vi.fn(),
  resize: vi.fn(),
  remove: vi.fn(),
  timeScale: () => ({ fitContent: vi.fn() }),
};

vi.mock("lightweight-charts", () => ({
  createChart: vi.fn(() => chartMock),
  AreaSeries: { type: "Area" },
  ColorType: { Solid: "solid" },
  LineStyle: { Solid: 0 },
}));

const points = [
  { ts: "2026-08-01T00:00:00Z", total_value: 5000, cash_balance: 2000, holdings_value: 3000 },
  { ts: "2026-09-01T00:00:00Z", total_value: 6000, cash_balance: 2000, holdings_value: 4000 },
];

afterEach(() => {
  vi.clearAllMocks();
  document.documentElement.removeAttribute("data-theme");
});

describe("PortfolioValueChart", () => {
  it("noktaları seriye yazar ve erişilebilir ad üretir", async () => {
    renderWithIntl(
      <PortfolioValueChart points={points} period="1mo" onPeriodChange={vi.fn()} />,
    );

    await waitFor(() => expect(chartMock.addSeries).toHaveBeenCalledTimes(1));
    expect(seriesMock.setData).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("img", { name: /Portföy değeri grafiği/ }),
    ).toBeInTheDocument();
  });

  it("periyot butonu onPeriodChange'i tetikler", async () => {
    const onPeriodChange = vi.fn();
    renderWithIntl(
      <PortfolioValueChart points={points} period="1mo" onPeriodChange={onPeriodChange} />,
    );

    const button = await screen.findByRole("button", { name: "1Y" });
    button.click();
    expect(onPeriodChange).toHaveBeenCalledWith("1y");
  });

  it("unmount'ta grafiği dispose eder (remove)", async () => {
    const { unmount } = renderWithIntl(
      <PortfolioValueChart points={points} period="1mo" onPeriodChange={vi.fn()} />,
    );

    await waitFor(() => expect(chartMock.addSeries).toHaveBeenCalled());
    unmount();
    expect(chartMock.remove).toHaveBeenCalledTimes(1);
  });
});
