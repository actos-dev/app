/**
 * Sembol çözümleyici testleri (Faz 3 / Birim 3.3).
 *
 * BIST varsayılanı, kanonik economy sembolleri ve legacy ad eşlemesi
 * doğrulanır. Saf fonksiyon olduğu için ağ/DB gerekmez.
 */
import { describe, expect, it } from "vitest";

import { ECONOMY_SYMBOLS, isEconomySymbol, resolveSymbol } from "@/lib/markets/symbol";

describe("resolveSymbol", () => {
  it("bilinen bir BIST ticker'ını bist olarak çözer", () => {
    expect(resolveSymbol("THYAO")).toEqual({
      kind: "bist",
      symbol: "THYAO",
      canonical: "THYAO",
    });
  });

  it("küçük harfli girdiyi büyük harfe çevirir", () => {
    expect(resolveSymbol("  asels  ")).toEqual({
      kind: "bist",
      symbol: "ASELS",
      canonical: "ASELS",
    });
  });

  it("kanonik economy sembollerini tanır (FX)", () => {
    expect(resolveSymbol("usd")).toEqual({ kind: "economy", symbol: "USD", canonical: "USD" });
    expect(resolveSymbol("EUR")).toEqual({ kind: "economy", symbol: "EUR", canonical: "EUR" });
  });

  it("kanonik metal sembollerini tanır", () => {
    expect(resolveSymbol("XAU-GRAM")).toEqual({
      kind: "economy",
      symbol: "XAU-GRAM",
      canonical: "XAU-GRAM",
    });
    expect(resolveSymbol("COIL-BRENT-USD")).toEqual({
      kind: "economy",
      symbol: "COIL-BRENT-USD",
      canonical: "COIL-BRENT-USD",
    });
  });

  it("registry legacy adlarını kanonik sembole eşler", () => {
    expect(resolveSymbol("gram-altin")).toEqual({
      kind: "economy",
      symbol: "GRAM-ALTIN",
      canonical: "XAU-GRAM",
    });
    expect(resolveSymbol("gumus")).toEqual({
      kind: "economy",
      symbol: "GUMUS",
      canonical: "XAG-GRAM",
    });
  });

  it("bilinmeyen sembolü BIST varsayar (doğrulama sayfada 404 ile)", () => {
    expect(resolveSymbol("BILINMEYEN")).toEqual({
      kind: "bist",
      symbol: "BILINMEYEN",
      canonical: "BILINMEYEN",
    });
  });

  it("economy sembol listesi boş değil ve tekrar içermez", () => {
    expect(ECONOMY_SYMBOLS.length).toBeGreaterThan(50);
    expect(new Set(ECONOMY_SYMBOLS).size).toBe(ECONOMY_SYMBOLS.length);
  });

  it("isEconomySymbol yalnız kanonik büyük harf değerleri kabul eder", () => {
    expect(isEconomySymbol("USD")).toBe(true);
    expect(isEconomySymbol("usd")).toBe(false);
    expect(isEconomySymbol("THYAO")).toBe(false);
  });
});
