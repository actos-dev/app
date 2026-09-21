/**
 * Simülasyon yardımcıları testleri (Faz 5 / Birim 5A.2).
 *
 * `bounds` anlamı backend `confidence_interval`ten çıkarıldı; bu testler
 * `1 - 2*bounds` eşlemesini ve hedef normalleştirmesini sabitler.
 */
import { describe, expect, it } from "vitest";

import {
  confidencePercent,
  confidenceRange,
  directionalProbability,
  historyDirection,
  historyProbability,
  isValidSimulationDays,
  isSimulationBounds,
  normalizeTarget,
  probabilityTone,
  resultProbabilityPercent,
  targetNumber,
} from "@/lib/simulations/simulation";
import type { SimulationHistoryDetail } from "@/lib/simulations/types";

describe("bounds → güven yüzdesi", () => {
  it("atılan kuyruk olasılığını bant kapsamına çevirir", () => {
    expect(confidencePercent("0.05")).toBe(90);
    expect(confidencePercent("0.025")).toBe(95);
    expect(confidencePercent("0.005")).toBe(99);
  });

  it("geçersiz bounds için null döner", () => {
    expect(confidencePercent("abc")).toBeNull();
    expect(confidencePercent(null)).toBeNull();
    expect(confidencePercent(0.9)).toBeNull();
  });

  it("izinli bounds seçeneklerini doğrular", () => {
    expect(isSimulationBounds("0.05")).toBe(true);
    expect(isSimulationBounds("0.025")).toBe(true);
    expect(isSimulationBounds("0.10")).toBe(false);
    expect(isSimulationBounds(null)).toBe(false);
  });
});

describe("gün doğrulaması", () => {
  it("1-370 arası tam sayıları kabul eder", () => {
    expect(isValidSimulationDays(1)).toBe(true);
    expect(isValidSimulationDays(370)).toBe(true);
    expect(isValidSimulationDays(0)).toBe(false);
    expect(isValidSimulationDays(371)).toBe(false);
    expect(isValidSimulationDays(1.5)).toBe(false);
  });
});

describe("hedef normalleştirme", () => {
  it("boş girdide null döner (otomatik hedef)", () => {
    expect(normalizeTarget("")).toBeNull();
    expect(normalizeTarget("   ")).toBeNull();
  });

  it("virgüllü ondalığı noktaya çevirir", () => {
    expect(normalizeTarget("12,5")).toBe("12.5");
  });

  it("sıfır/negatif/sayı olmayan girdide undefined döner", () => {
    expect(normalizeTarget("0")).toBeUndefined();
    expect(normalizeTarget("-5")).toBeUndefined();
    expect(normalizeTarget("abc")).toBeUndefined();
  });

  it("`auto` hedefini sayıya çevirmez", () => {
    expect(targetNumber("auto")).toBeNull();
    expect(targetNumber("42.5")).toBe(42.5);
  });
});

describe("yön farkındalıklı olasılık", () => {
  it("above yönünde prob_above seçer", () => {
    expect(directionalProbability({ direction: "above", prob_above: 0.8, prob_below: 0.2 })).toBe(0.8);
  });

  it("below yönünde prob_below seçer", () => {
    expect(directionalProbability({ direction: "below", prob_above: 0.8, prob_below: 0.2 })).toBe(0.2);
  });

  it("yön yoksa above varsayar", () => {
    expect(directionalProbability({ prob_above: 0.6, prob_below: 0.4 })).toBe(0.6);
  });

  it("eksik değerde null döner", () => {
    expect(directionalProbability({ direction: "above" })).toBeNull();
  });
});

describe("olasılık tonu", () => {
  it("above yönünde yüksek olasılık olumlu, düşük olumsuz", () => {
    expect(probabilityTone(0.9, "above")).toBe("positive");
    expect(probabilityTone(0.1, "above")).toBe("negative");
    expect(probabilityTone(0.5, "above")).toBe("neutral");
  });

  it("below yönünde anlam tersine döner", () => {
    expect(probabilityTone(0.1, "below")).toBe("positive");
    expect(probabilityTone(0.9, "below")).toBe("negative");
  });

  it("null olasılık nötrdür", () => {
    expect(probabilityTone(null, "above")).toBe("neutral");
  });
});

describe("güven aralığı", () => {
  it("min/max değerlerini sıralı döner", () => {
    expect(confidenceRange({ min: 200, max: 100, percent: 0.9, days: 30, bounds: "0.05" })).toEqual({
      min: 100,
      max: 200,
    });
  });

  it("eksik aralıkta null döner", () => {
    expect(confidenceRange(null)).toBeNull();
    expect(confidenceRange(undefined)).toBeNull();
  });
});

describe("koşu sonucu", () => {
  it("yüzde olasılığı hesaplar", () => {
    expect(
      resultProbabilityPercent({
        prob_above: 0.72,
        prob_below: 0.28,
        confidence: { min: 1, max: 2, percent: 0.9, days: 30, bounds: "0.05" },
        direction: "above",
        simulation_id: 1,
        ticker: "ASELS",
        days: 30,
        target: "auto",
        bounds: "0.05",
        credits_spend: 0.15,
        remaining_credits: 99,
      }),
    ).toBeCloseTo(72);
  });
});

describe("geçmiş detayı", () => {
  const detail: SimulationHistoryDetail = {
    id: 1,
    ticker: "ASELS",
    days: 30,
    bounds: "0.05",
    target: "auto",
    result: { prob_above: 0.3, prob_below: 0.7, direction: "below" },
    cost: 0.15,
    created_at: "2026-09-21T10:00:00Z",
  };

  it("yönü kayıttan okur, yoksa above varsayar", () => {
    expect(historyDirection(detail)).toBe("below");
    expect(historyDirection({ ...detail, result: {} })).toBe("above");
  });

  it("yöne göre olasılığı seçer", () => {
    expect(historyProbability(detail)).toBe(0.7);
  });
});
