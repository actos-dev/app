/**
 * Danışman yardımcıları testleri (Faz 5 / Birim 5A.2).
 */
import { describe, expect, it } from "vitest";

import {
  advisorResultHref,
  barTone,
  isAdvisorHorizon,
  isAdvisorProfitability,
  isAdvisorRiskTolerance,
  normalizeAdvisorTicker,
  scorePercent,
  sortAdvisorResults,
  vectorValue,
  VECTOR_INDEX,
} from "@/lib/advisor/advisor";
import type { AdvisorFitResult } from "@/lib/advisor/types";

describe("seviye doğrulamaları", () => {
  it("vade allowlist'ini kontrol eder", () => {
    expect(isAdvisorHorizon("short")).toBe(true);
    expect(isAdvisorHorizon("long")).toBe(true);
    expect(isAdvisorHorizon("weekly")).toBe(false);
  });

  it("kârlılık ve risk allowlist'lerini kontrol eder", () => {
    expect(isAdvisorProfitability("high")).toBe(true);
    expect(isAdvisorProfitability("extreme")).toBe(false);
    expect(isAdvisorRiskTolerance("medium")).toBe(true);
    expect(isAdvisorRiskTolerance("none")).toBe(false);
  });
});

describe("vektör ve skor", () => {
  it("vektör değerini 0..1 aralığına kırpar", () => {
    const vector = [1.4, -0.2, 0.5];
    expect(vectorValue(vector, VECTOR_INDEX.risk)).toBe(1);
    expect(vectorValue(vector, VECTOR_INDEX.horizon)).toBe(0);
    expect(vectorValue(vector, VECTOR_INDEX.profitability)).toBe(0.5);
  });

  it("eksik indekste null döner", () => {
    expect(vectorValue([0.5], 2)).toBeNull();
    expect(vectorValue(null, 0)).toBeNull();
  });

  it("skoru yüzdeye çevirir", () => {
    expect(scorePercent(0.72)).toBe(72);
    expect(scorePercent(1.5)).toBe(100);
    expect(scorePercent(null)).toBeNull();
  });

  it("bar tonunu eşiklere göre seçer", () => {
    expect(barTone(0.8)).toBe("positive");
    expect(barTone(0.5)).toBe("neutral");
    expect(barTone(0.2)).toBe("negative");
    expect(barTone(null)).toBe("neutral");
  });
});

describe("öneri yardımcıları", () => {
  const results: AdvisorFitResult[] = [
    { ticker: "A", vector: [0.1, 0.2, 0.3], score: 0.4, distance: 1.5 },
    { ticker: "B", vector: [0.1, 0.2, 0.3], score: 0.9, distance: 0.1 },
  ];

  it("ticker'ı normalleştirip sembol yoluna bağlar", () => {
    expect(normalizeAdvisorTicker(" asels ")).toBe("ASELS");
    expect(advisorResultHref("asels")).toBe("/symbol/ASELS");
  });

  it("sonuçları skora göre azalan sıralar", () => {
    expect(sortAdvisorResults(results).map((item) => item.ticker)).toEqual(["B", "A"]);
  });
});
