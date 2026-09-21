/**
 * Grafik periyodu yardımcıları testleri (Faz 3 / Birim 3.3).
 */
import { describe, expect, it } from "vitest";

import {
  DEFAULT_CHART_PERIOD,
  isChartPeriod,
  parseChartPeriod,
} from "@/lib/markets/periods";

describe("parseChartPeriod", () => {
  it("geçerli periyodu aynen döner", () => {
    expect(parseChartPeriod("1y")).toBe("1y");
    expect(parseChartPeriod(["5y", "1mo"])).toBe("5y");
  });

  it("eksik/geçersiz değerde varsayılana düşer", () => {
    expect(parseChartPeriod(undefined)).toBe(DEFAULT_CHART_PERIOD);
    expect(parseChartPeriod("10y")).toBe(DEFAULT_CHART_PERIOD);
    expect(parseChartPeriod("")).toBe(DEFAULT_CHART_PERIOD);
  });

  it("isChartPeriod yalnız izinli değerleri kabul eder", () => {
    expect(isChartPeriod("3mo")).toBe(true);
    expect(isChartPeriod("1d")).toBe(false);
    expect(isChartPeriod(3)).toBe(false);
  });
});
