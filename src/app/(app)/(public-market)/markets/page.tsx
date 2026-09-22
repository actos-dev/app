/**
 * `/markets` — birleşik piyasa ekranı (Faz 3 / Birim 3.2, plan §4; 5C / X-06, X-07).
 *
 * Sunucu bileşeni: sekme (`asset`), sıralama (`sort`), sayfa (`page`) ve arama
 * (`q`) URL'den okunur, veri `serverApiFetch` (çerezsiz) ile RSC'de çekilir ve
 * tablolara `initialData` olarak geçirilir. Böylece istemci ilk boyamada ikinci
 * bir istek atmaz (çift istek yok) ve JS'siz gezinme çalışır.
 *
 * `market/status` (public) ile asset verisi paralel çekilir; tablo başına en
 * fazla bir liste isteği vardır (P-02). Yanıtlardan biri `429` ise kullanıcıya
 * "çok fazla istek" uyarısı ve varsa `Retry-After` süresi gösterilir (X-07).
 */
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { EconomyTable } from "@/components/market/EconomyTable";
import { IpoTable } from "@/components/market/IpoTable";
import { MarketStatusPill } from "@/components/market/MarketStatusPill";
import { MarketsTabs } from "@/components/market/MarketsTabs";
import { StocksTable } from "@/components/market/StocksTable";
import { SymbolSearch } from "@/components/market/SymbolSearch";
import { PageHeader } from "@/components/shared/PageHeader";
import { RateLimitNotice } from "@/components/shared/RateLimitNotice";
import { collectRateLimit, type RateLimitResult } from "@/lib/api/rate-limit";
import { parseAsset, parsePage, parseSort, type MarketAsset } from "@/lib/markets/params";
import type {
  CompanySummaryResponse,
  CompanySummarySort,
  EconomyQuoteBundle,
  IpoRow,
} from "@/types/market";

import {
  ECONOMY_GROUP_BY_ASSET,
  fetchCompaniesSummary,
  fetchEconomyQuotes,
  fetchIpos,
  fetchMarketStatusResult,
} from "./markets-data";

type MarketsData =
  | { asset: "stocks"; data: CompanySummaryResponse | null }
  | { asset: "fx"; data: EconomyQuoteBundle | null }
  | { asset: "metals"; data: EconomyQuoteBundle | null }
  | { asset: "ipos"; rows: IpoRow[]; failed: boolean };

type AssetPayload = {
  data: MarketsData;
  /** Sekmenin attığı isteklerin sonuçları; toplu 429 tespiti için (X-07). */
  results: RateLimitResult[];
};

async function loadAssetData(
  asset: MarketAsset,
  sort: CompanySummarySort,
  page: number,
): Promise<AssetPayload> {
  switch (asset) {
    case "stocks": {
      const result = await fetchCompaniesSummary(sort, page);
      return { data: { asset, data: result.data }, results: [result] };
    }
    case "fx":
    case "metals": {
      const result = await fetchEconomyQuotes(ECONOMY_GROUP_BY_ASSET[asset]);
      return { data: { asset, data: result.data }, results: [result] };
    }
    case "ipos": {
      const payload = await fetchIpos();
      return {
        data: { asset, rows: payload.rows, failed: payload.failed },
        results: payload.results,
      };
    }
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [t, app, locale] = await Promise.all([
    getTranslations("markets"),
    getTranslations("app"),
    getLocale(),
  ]);

  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: { canonical: "/markets" },
    openGraph: {
      type: "website",
      url: "/markets",
      siteName: app("name"),
      title,
      description,
      locale: locale === "tr" ? "tr_TR" : "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** `?q=` arama terimini ilk değere indirger (SymbolSearch ilk değeri alır). */
function firstQuery(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export default async function MarketsPage({ searchParams }: PageProps<"/markets">) {
  const params = await searchParams;
  const asset = parseAsset(params.asset);
  const sort = parseSort(params.sort);
  const page = parsePage(params.page);
  const query = firstQuery(params.q);

  const [statusResult, payload, t] = await Promise.all([
    fetchMarketStatusResult(),
    loadAssetData(asset, sort, page),
    getTranslations("markets"),
  ]);

  const rateLimit = collectRateLimit([statusResult, ...payload.results]);
  const data = payload.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <SymbolSearch className="sm:w-72" initialQuery={query} />
            <MarketStatusPill initialData={statusResult.data ?? undefined} />
          </div>
        }
      />

      {rateLimit.limited
        ? await RateLimitNotice({ retryAfter: rateLimit.retryAfter })
        : null}

      <MarketsTabs active={asset} />

      {data.asset === "stocks" ? (
        <StocksTable initialData={data.data} sort={sort} page={page} />
      ) : null}
      {data.asset === "fx" || data.asset === "metals" ? (
        <EconomyTable asset={data.asset} initialData={data.data} />
      ) : null}
      {data.asset === "ipos" ? <IpoTable rows={data.rows} failed={data.failed} /> : null}
    </div>
  );
}
