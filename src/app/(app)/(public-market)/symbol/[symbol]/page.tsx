/**
 * `/symbol/[symbol]` — tek enstrüman detayı (Faz 3 / Birim 3.3, plan §4; 5C / X-06).
 *
 * Sunucu bileşeni: sembol çözümlenir (`resolveSymbol`), BIST'te `/companies/info`
 * 404'ü `notFound()` ile gerçek 404'e çevrilir. SSR verisi `serverApiFetch`
 * (çerezsiz) ile çekilir ve istemci adasına geçirilir; grafik client-only'dir.
 *
 * SEO: `generateMetadata` isim/kod ile başlık/açıklama/canonical/OG üretir —
 * CANLI fiyat/değişim metadata açıklamasına KONMAZ (crawl edilen içerik
 * stabil kalmalı, X-06). Sayfaya `BreadcrumbList` JSON-LD eklenir.
 */
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { SymbolDetail } from "@/components/market/SymbolDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl } from "@/config/site";
import { parseChartPeriod } from "@/lib/markets/periods";
import { resolveSymbol } from "@/lib/markets/symbol";

import {
  fetchCompanyProfile,
  fetchCompanySummary,
  fetchEconomyQuote,
  fetchTickerNews,
} from "./symbol-data";

/** OG `locale` alanı için `tr-TR`/`en-US` biçimi. */
function openGraphLocale(locale: string): string {
  return locale === "tr" ? "tr_TR" : "en_US";
}

export async function generateMetadata({
  params,
}: PageProps<"/symbol/[symbol]">): Promise<Metadata> {
  const { symbol } = await params;
  const resolved = resolveSymbol(symbol);
  const [t, app, locale] = await Promise.all([
    getTranslations("seo"),
    getTranslations("app"),
    getLocale(),
  ]);
  const canonicalPath = `/symbol/${resolved.canonical}`;

  if (resolved.kind === "bist") {
    // `cache()` sayesinde sayfa ile aynı istek içinde tek ağ çağrısı.
    const profile = await fetchCompanyProfile(resolved.canonical);
    const name = profile.data?.name ?? resolved.symbol;
    const description = t("symbolDescription", { name, symbol: resolved.symbol });

    return {
      title: name,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        type: "website",
        url: canonicalPath,
        siteName: app("name"),
        title: name,
        description,
        locale: openGraphLocale(locale),
      },
      twitter: { card: "summary_large_image", title: name, description },
    };
  }

  const description = t("economyDescription", { symbol: resolved.canonical });

  return {
    title: resolved.canonical,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      url: canonicalPath,
      siteName: app("name"),
      title: resolved.canonical,
      description,
      locale: openGraphLocale(locale),
    },
    twitter: { card: "summary_large_image", title: resolved.canonical, description },
  };
}

/**
 * Sembol sayfası breadcrumb'ı: Piyasalar → Sembol. `item` mutlak URL olmalıdır
 * (schema.org + Google); taban `NEXT_PUBLIC_SITE_URL`'den gelir.
 */
function symbolBreadcrumb(marketsLabel: string, canonical: string): Record<string, unknown> {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: marketsLabel,
        item: `${base}/markets`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: canonical,
        item: `${base}/symbol/${canonical}`,
      },
    ],
  };
}

export default async function SymbolPage({
  params,
  searchParams,
}: PageProps<"/symbol/[symbol]">) {
  const [{ symbol }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("nav"),
  ]);
  const resolved = resolveSymbol(symbol);
  const period = parseChartPeriod(query.period);
  const breadcrumb = symbolBreadcrumb(t("markets"), resolved.canonical);

  if (resolved.kind === "economy") {
    const quote = await fetchEconomyQuote(resolved.canonical);
    return (
      <>
        <JsonLd data={breadcrumb} />
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
      </>
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
    <>
      <JsonLd data={breadcrumb} />
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
    </>
  );
}
