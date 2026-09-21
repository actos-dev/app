/**
 * `/markets` — birleşik piyasa ekranı (Faz 3 / Birim 3.2, plan §4).
 *
 * Sunucu bileşeni: sekme (`asset`), sıralama (`sort`) ve sayfa (`page`) URL'den
 * okunur, veri `serverAuthApiFetch` ile (çerez forward edilerek) RSC'de çekilir
 * ve tablolara `initialData` olarak geçirilir. Böylece istemci ilk boyamada
 * ikinci bir istek atmaz (çift istek yok) ve JS'siz gezinme çalışır.
 *
 * `market/status` (public) ile asset verisi paralel çekilir; tablo başına en
 * fazla bir liste isteği vardır (P-02).
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EconomyTable } from "@/components/market/EconomyTable";
import { IpoTable } from "@/components/market/IpoTable";
import { MarketStatusPill } from "@/components/market/MarketStatusPill";
import { MarketsTabs } from "@/components/market/MarketsTabs";
import { StocksTable } from "@/components/market/StocksTable";
import { SymbolSearch } from "@/components/market/SymbolSearch";
import { PageHeader } from "@/components/shared/PageHeader";
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
  fetchMarketStatus,
} from "./markets-data";

type MarketsData =
  | { asset: "stocks"; data: CompanySummaryResponse | null }
  | { asset: "fx"; data: EconomyQuoteBundle | null }
  | { asset: "metals"; data: EconomyQuoteBundle | null }
  | { asset: "ipos"; rows: IpoRow[]; failed: boolean };

async function loadAssetData(
  asset: MarketAsset,
  sort: CompanySummarySort,
  page: number,
): Promise<MarketsData> {
  switch (asset) {
    case "stocks":
      return { asset, data: await fetchCompaniesSummary(sort, page) };
    case "fx":
    case "metals":
      return { asset, data: await fetchEconomyQuotes(ECONOMY_GROUP_BY_ASSET[asset]) };
    case "ipos": {
      const { rows, failed } = await fetchIpos();
      return { asset, rows, failed };
    }
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("markets") };
}

export default async function MarketsPage({ searchParams }: PageProps<"/markets">) {
  const params = await searchParams;
  const asset = parseAsset(params.asset);
  const sort = parseSort(params.sort);
  const page = parsePage(params.page);

  const [status, data, t] = await Promise.all([
    fetchMarketStatus(),
    loadAssetData(asset, sort, page),
    getTranslations("markets"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <SymbolSearch className="sm:w-72" />
            <MarketStatusPill initialData={status ?? undefined} />
          </div>
        }
      />

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
