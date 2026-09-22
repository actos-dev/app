/**
 * Landing (plan Faz 2 / Birim 2.3a, §2.2, M-07; D-12).
 *
 * Public ana sayfa tam SSR'dır; tüm metinler `landing.*` altından gelir.
 * Raster görsel yoktur: ürün anlatımı gerçek popüler hisse verisiyle
 * (PopularStocks) ve düz metin bölümleriyle yapılır.
 */
import { BarChart3, Briefcase, FileText, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { LucideIcon } from "lucide-react";

import { PopularStocks } from "@/components/marketing/PopularStocks";
import { JsonLd } from "@/components/seo/JsonLd";
import { buttonVariants } from "@/components/ui/button";
import { getSiteUrl } from "@/config/site";
import { defaultLocale, isLocale } from "@/i18n/config";
import { serverApiFetchWithStatus } from "@/lib/api/server";
import type { CompanySummaryResponse } from "@/types/market";

const FEATURES = [
  { key: "market", icon: TrendingUp },
  { key: "reports", icon: FileText },
  { key: "simulation", icon: BarChart3 },
  { key: "portfolio", icon: Briefcase },
] as const satisfies readonly { key: string; icon: LucideIcon }[];

const STEPS = ["register", "explore", "build"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const [t, app, locale] = await Promise.all([
    getTranslations("landing"),
    getTranslations("app"),
    getLocale(),
  ]);

  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      siteName: app("name"),
      title,
      description,
      locale: locale === "tr" ? "tr_TR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LandingPage() {
  const [t, app, locale, summary] = await Promise.all([
    getTranslations("landing"),
    getTranslations("app"),
    getLocale(),
    // Popüler hisseler gerçek veriden gelir; ağ/JSON hatasında `null` olur ve
    // boş fallback çizilir, böylece landing asla çökmez.
    serverApiFetchWithStatus<CompanySummaryResponse>("/api/v1/companies/summary", {
      revalidate: 60,
      query: { limit: 5, offset: 0, sort: "popular" },
    }).catch(() => null),
  ]);

  // JSON-LD: WebSite (+ SearchAction → /markets?q=) ve Organization. Arama
  // hedefi gerçekten çalışır: `/markets` `q` parametresini SymbolSearch'e
  // başlangıç terimi olarak geçirir.
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: app("name"),
        url: siteUrl,
        description: app("description"),
      },
      {
        "@type": "WebSite",
        name: app("name"),
        url: siteUrl,
        description: app("description"),
        inLanguage: "tr",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/markets?asset=stocks&q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-14 md:px-6 md:py-24">
          <div className="flex flex-col items-start gap-5">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="max-w-prose text-base text-muted-foreground md:text-lg">
              {t("heroDescription")}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/register" className={buttonVariants({ variant: "primary", size: "lg" })}>
                {t("ctaPrimary")}
              </Link>
              <Link href="/markets" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                {t("ctaSecondary")}
              </Link>
            </div>
          </div>
          <PopularStocks
            rows={summary?.data?.data ?? []}
            title={t("popular.title")}
            viewAllLabel={t("popular.viewAll")}
            locale={isLocale(locale) ? locale : defaultLocale}
          />
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t("featuresTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {t("featuresDescription")}
            </p>
          </div>
          <ul
            data-testid="landing-features"
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {FEATURES.map((feature) => (
              <li
                key={feature.key}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
              >
                <span className="flex size-10 items-center justify-center rounded-md bg-surface-raised text-primary">
                  <feature.icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="text-base font-semibold text-foreground">
                  {t(`features.${feature.key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`features.${feature.key}.description`)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t("stepsTitle")}
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step} className="flex flex-col gap-3">
                <span className="flex size-8 items-center justify-center rounded-full border border-border bg-surface font-mono text-sm tabular-nums text-primary">
                  {index + 1}
                </span>
                <h3 className="text-base font-semibold text-foreground">
                  {t(`steps.${step}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">{t(`steps.${step}.description`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-4 py-16 md:items-center md:px-6 md:py-24 md:text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t("ctaTitle")}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            {t("ctaDescription")}
          </p>
          <Link href="/register" className={buttonVariants({ variant: "primary", size: "lg" })}>
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </>
  );
}
