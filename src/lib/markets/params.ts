/**
 * `/markets` URL parametreleri (Faz 3 / Birim 3.2, plan M-06).
 *
 * Sekme (`asset`), sıralama (`sort`) ve sayfa (`page`) durumu URL'e yazılır;
 * böylece SSR ve JS'siz gezinme çalışır, geri/ileri tuşları doğru davranır.
 * Saf fonksiyonlar olduğu için sunucu ve istemci bile olsa aynı şekilde
 * test edilebilir.
 */
import type { Route } from "next";

import type { CompanySummarySort } from "@/types/market";

/** `/markets` varlık sekmeleri. */
export const MARKET_ASSETS = ["stocks", "fx", "metals", "ipos"] as const;
export type MarketAsset = (typeof MARKET_ASSETS)[number];
export const DEFAULT_MARKET_ASSET: MarketAsset = "stocks";

/** Backend `/companies/summary` sıralama allowlist'i (`api/bist.py:69`). */
export const COMPANY_SORTS = [
  "popular",
  "alphabetical",
  "gainers",
  "losers",
  "price_high",
  "price_low",
  "volume",
  "market_cap",
] as const satisfies readonly CompanySummarySort[];

export const DEFAULT_COMPANY_SORT: CompanySummarySort = "popular";

/** Sunucu sayfalamasında sayfa başına satır sayısı. */
export const MARKETS_PAGE_SIZE = 50;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function isMarketAsset(value: unknown): value is MarketAsset {
  return typeof value === "string" && (MARKET_ASSETS as readonly string[]).includes(value);
}

export function isCompanySort(value: unknown): value is CompanySummarySort {
  return typeof value === "string" && (COMPANY_SORTS as readonly string[]).includes(value);
}

/** `?asset=` değerini doğrular; geçersiz/eksikse varsayılana düşer. */
export function parseAsset(value: string | string[] | undefined): MarketAsset {
  const raw = firstValue(value);
  return isMarketAsset(raw) ? raw : DEFAULT_MARKET_ASSET;
}

/** `?sort=` değerini doğrular; geçersiz/eksikse varsayılana düşer. */
export function parseSort(value: string | string[] | undefined): CompanySummarySort {
  const raw = firstValue(value);
  return isCompanySort(raw) ? raw : DEFAULT_COMPANY_SORT;
}

/** `?page=` değerini 1 tabanlı pozitif tam sayıya indirger. */
export function parsePage(value: string | string[] | undefined): number {
  const raw = firstValue(value);
  const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export type MarketsHrefOptions = {
  sort?: CompanySummarySort;
  page?: number;
};

/**
 * `/markets` bağlantısı üretir. Varsayılan değerler (popüler sıralama, 1.
 * sayfa) URL'de tekrarlanmaz; sekmeye özgü olmayan parametreler düşürülür.
 */
export function buildMarketsHref(asset: MarketAsset, options: MarketsHrefOptions = {}): Route {
  const params = new URLSearchParams();
  params.set("asset", asset);

  if (asset === "stocks") {
    if (options.sort && options.sort !== DEFAULT_COMPANY_SORT) {
      params.set("sort", options.sort);
    }
    if (options.page && options.page > 1) {
      params.set("page", String(options.page));
    }
  }

  // typedRoutes dinamik query string'i statik olarak ifade edemediğinden tek
  // zorunlu cast; hedef her zaman `/markets?...` deseninde kalır.
  return `/markets?${params.toString()}` as Route;
}

/** Sekme çubuğu için yalnız `asset` taşıyan bağlantı. */
export function buildAssetHref(asset: MarketAsset): Route {
  return buildMarketsHref(asset);
}
