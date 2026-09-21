/**
 * Al/sat komisyon hesabı testleri (Faz 4 / Birim 4.2, U-04, U-05).
 *
 * Backend `_add_transaction` davranışı doğrulanır: ALIŞ'ta komisyon eklenir,
 * SATIŞ'ta düşülür; oran geçersizse varsayılana düşülür.
 */
import { describe, expect, it } from "vitest";

import {
  DEFAULT_COMMISSION_RATE,
  computeTradeTotals,
  getCommissionRate,
} from "@/lib/portfolio/trade";

describe("getCommissionRate", () => {
  it("değer verilmezse backend varsayılanını döner", () => {
    expect(getCommissionRate(undefined)).toBe(DEFAULT_COMMISSION_RATE);
    expect(getCommissionRate("")).toBe(DEFAULT_COMMISSION_RATE);
    expect(getCommissionRate("  ")).toBe(DEFAULT_COMMISSION_RATE);
  });

  it("geçersiz veya negatif değerde varsayılana düşer", () => {
    expect(getCommissionRate("abc")).toBe(DEFAULT_COMMISSION_RATE);
    expect(getCommissionRate("-1")).toBe(DEFAULT_COMMISSION_RATE);
  });

  it("ondalık virgülü kabul eder", () => {
    expect(getCommissionRate("0,002")).toBe(0.002);
  });
});

describe("computeTradeTotals", () => {
  it("ALIŞ'ta komisyonu maliyete ekler", () => {
    const totals = computeTradeTotals(100, 10, "BUY", 0.001);
    expect(totals).not.toBeNull();
    expect(totals?.subtotal).toBe(1000);
    expect(totals?.commission).toBe(1);
    expect(totals?.total).toBe(1001);
  });

  it("SATIŞ'ta komisyonu hasılattan düşer", () => {
    const totals = computeTradeTotals(100, 10, "SELL", 0.001);
    expect(totals?.commission).toBe(1);
    expect(totals?.total).toBe(999);
  });

  it("komisyonu 2 basamağa yuvarlar (backend ile aynı)", () => {
    // 123.45 * 0.001 = 0.12345 → 0.12
    const totals = computeTradeTotals(123.45, 1, "BUY", 0.001);
    expect(totals?.commission).toBe(0.12);
    expect(totals?.total).toBe(123.57);
  });

  it("geçersiz fiyat/adette null döner", () => {
    expect(computeTradeTotals(0, 10, "BUY")).toBeNull();
    expect(computeTradeTotals(100, 0, "BUY")).toBeNull();
    expect(computeTradeTotals(null, 10, "BUY")).toBeNull();
    expect(computeTradeTotals(Number.NaN, 10, "BUY")).toBeNull();
  });
});
