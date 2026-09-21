/**
 * `/markets` URL parametre çözümleyicileri ve bağlantı üreticileri
 * (Faz 3 / Birim 3.2). Saf fonksiyonlar; SSR ve istemci aynı sonucu alır.
 */
import { describe, expect, it } from "vitest";

import {
  buildAssetHref,
  buildMarketsHref,
  DEFAULT_COMPANY_SORT,
  DEFAULT_MARKET_ASSET,
  isCompanySort,
  isMarketAsset,
  parseAsset,
  parsePage,
  parseSort,
} from "@/lib/markets/params";

describe("parseAsset / parseSort / parsePage", () => {
  it("geçerli değerleri kabul eder", () => {
    expect(parseAsset("fx")).toBe("fx");
    expect(parseSort("market_cap")).toBe("market_cap");
    expect(parsePage("3")).toBe(3);
  });

  it("geçersiz veya eksik değerlerde varsayılana düşer", () => {
    expect(parseAsset(undefined)).toBe(DEFAULT_MARKET_ASSET);
    expect(parseAsset("bonds")).toBe(DEFAULT_MARKET_ASSET);
    expect(parseSort(undefined)).toBe(DEFAULT_COMPANY_SORT);
    expect(parseSort("unknown")).toBe(DEFAULT_COMPANY_SORT);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-4")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });

  it("dizi parametrelerinde ilk değeri kullanır", () => {
    expect(parseAsset(["metals", "fx"])).toBe("metals");
    expect(parseSort(["volume", "losers"])).toBe("volume");
    expect(parsePage(["2", "9"])).toBe(2);
  });

  it("tip koruma fonksiyonları allowlist dışını reddeder", () => {
    expect(isMarketAsset("ipos")).toBe(true);
    expect(isMarketAsset("ipos2")).toBe(false);
    expect(isCompanySort("price_high")).toBe(true);
    expect(isCompanySort("price")).toBe(false);
  });
});

describe("buildMarketsHref", () => {
  it("varsayılan sort/page değerlerini URL'de tekrarlamaz", () => {
    expect(buildMarketsHref("stocks")).toBe("/markets?asset=stocks");
    expect(buildMarketsHref("stocks", { sort: "popular", page: 1 })).toBe(
      "/markets?asset=stocks",
    );
  });

  it("sort ve page değerlerini taşır", () => {
    expect(buildMarketsHref("stocks", { sort: "gainers", page: 3 })).toBe(
      "/markets?asset=stocks&sort=gainers&page=3",
    );
  });

  it("stocks dışındaki sekmelerde sort/page parametrelerini düşürür", () => {
    expect(buildMarketsHref("fx", { sort: "gainers", page: 3 })).toBe("/markets?asset=fx");
  });

  it("buildAssetHref yalnız asset taşır", () => {
    expect(buildAssetHref("metals")).toBe("/markets?asset=metals");
  });
});
