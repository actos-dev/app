/**
 * `/watchlist` — takip listesi (Faz 3 / Birim 3.4, plan §4).
 *
 * Sunucu bileşeni: favori ticker'lar ve tek toplu fiyat yanıtı RSC'de
 * (çerez forward edilerek) çekilir ve istemci tabloya `initialData` geçirilir.
 * Böylece ilk boyamada satır başına istek olmaz (P-02); tablo piyasa açıkken
 * `usePollingInterval` ile yenilenir, favori kaldırma optimistic çalışır.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { WatchlistTable } from "@/components/market/WatchlistTable";
import { PageHeader } from "@/components/shared/PageHeader";

import { fetchMarketStatus } from "@/app/(app)/(public-market)/markets/markets-data";

import { fetchWatchlistData } from "./watchlist-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("watchlist") };
}

export default async function WatchlistPage() {
  const [data, status, t] = await Promise.all([
    fetchWatchlistData(),
    fetchMarketStatus(),
    getTranslations("watchlist"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <WatchlistTable
        initialFavorites={data.favorites}
        initialSummary={data.summary}
        initialFailed={data.failed}
        initialStatus={status ?? undefined}
      />
    </div>
  );
}
