/**
 * `/symbol/[symbol]` — tek enstrüman detayı (Faz 3 / Birim 3.3, plan §4).
 *
 * Sunucu bileşeni: sembol çözümlenir (`resolveSymbol`), BIST'te `/companies/info`
 * 404'ü `notFound()` ile gerçek 404'e çevrilir. SSR verisi çerez forward
 * edilerek çekilir ve istemci adasına geçirilir; grafik client-only'dir.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SymbolDetail } from "@/components/market/SymbolDetail";
import { parseChartPeriod } from "@/lib/markets/periods";
import { resolveSymbol } from "@/lib/markets/symbol";

import {
  fetchCompanyProfile,
  fetchCompanySummary,
  fetchEconomyQuote,
  fetchTickerNews,
} from "./symbol-data";

export async function generateMetadata({
  params,
}: PageProps<"/symbol/[symbol]">): Promise<Metadata> {
  const { symbol } = await params;
  const resolved = resolveSymbol(symbol);

  if (resolved.kind === "bist") {
    // `cache()` sayesinde sayfa ile aynı istek içinde tek ağ çağrısı.
    const profile = await fetchCompanyProfile(resolved.canonical);
    return { title: profile.data?.name ?? resolved.symbol };
  }

  return { title: resolved.canonical };
}

export default async function SymbolPage({
  params,
  searchParams,
}: PageProps<"/symbol/[symbol]">) {
  const [{ symbol }, query] = await Promise.all([params, searchParams]);
  const resolved = resolveSymbol(symbol);
  const period = parseChartPeriod(query.period);

  if (resolved.kind === "economy") {
    const quote = await fetchEconomyQuote(resolved.canonical);
    return (
      <SymbolDetail
        kind="economy"
        symbol={resolved.symbol}
        canonical={resolved.canonical}
        name={resolved.canonical}
        profile={null}
        summary={null}
        quote={quote}
        news={null}
        initialPeriod={period}
      />
    );
  }

  const [profile, summary, news] = await Promise.all([
    fetchCompanyProfile(resolved.canonical),
    fetchCompanySummary(resolved.canonical),
    fetchTickerNews(resolved.canonical),
  ]);

  if (profile.status === 404) {
    notFound();
  }

  return (
    <SymbolDetail
      kind="bist"
      symbol={resolved.symbol}
      canonical={resolved.canonical}
      name={profile.data?.name ?? resolved.symbol}
      profile={profile.data}
      summary={summary}
      quote={null}
      news={news}
      initialPeriod={period}
    />
  );
}
