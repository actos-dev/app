"use client";

/**
 * Enstrüman detay gövdesi (Faz 3 / Birim 3.3).
 *
 * Sunucu bileşeni çözümleme + doğrulama + SSR verisini yapar; bu istemci
 * adası başlığı, veri tazeliğini (S-15), favori toggle'ını (U-12) ve
 * sekmeleri render eder. Grafik `next/dynamic({ ssr: false })` ile ayrı
 * chunk'tan ve yalnız "Grafik" sekmesi açıldığında yüklenir (D-06, P-12).
 *
 * Al/sat diyaloğu Faz 4'e aittir; burada sahte işlem UI'ı yoktur, yalnız
 * portföye götüren bir CTA vardır.
 */
import { Star, StarOff, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState, type ReactNode } from "react";

import { Delta } from "@/components/market/Delta";
import { MarketStatusPill } from "@/components/market/MarketStatusPill";
import { PriceText } from "@/components/market/PriceText";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { useFavorites } from "@/hooks/useFavorites";
import { useFormatters } from "@/lib/format";
import { buildSymbolHref, type ChartPeriod } from "@/lib/markets/periods";
import { safeExternalUrl } from "@/lib/safe-url";
import { cn } from "@/lib/utils";
import type {
  CompanyInfo,
  CompanySummary,
  EconomyQuote,
  NewsArticle,
} from "@/types/market";

const PriceChart = dynamic(
  () => import("@/components/market/PriceChart").then((module) => module.PriceChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  const t = useTranslations("symbol.chart");
  return (
    <div className="flex flex-col gap-2" role="status">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-80 w-full md:h-96" />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}

type SymbolDetailProps = {
  kind: "bist" | "economy";
  /** Görünen/URL sembolü (kullanıcı girdisinin büyük harfli hali). */
  symbol: string;
  /** Backend'e gidecek kanonik sembol. */
  canonical: string;
  name: string;
  profile: CompanyInfo | null;
  summary: CompanySummary | null;
  quote: EconomyQuote | null;
  news: NewsArticle[] | null;
  initialPeriod: ChartPeriod;
};

type StatItemProps = {
  label: string;
  value: ReactNode;
};

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border bg-surface px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function FavoriteToggle({ ticker }: { ticker: string }) {
  const t = useTranslations("symbol.favorite");
  const favorites = useFavorites();
  const isFavorite = favorites.isFavorite(ticker);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t("remove") : t("add")}
      disabled={favorites.isLoading || favorites.isPending}
      onClick={() => favorites.toggle(ticker)}
    >
      {isFavorite ? (
        <Star aria-hidden="true" className="size-4" />
      ) : (
        <StarOff aria-hidden="true" className="size-4" />
      )}
      {isFavorite ? t("remove") : t("add")}
    </Button>
  );
}

export function SymbolDetail({
  kind,
  symbol,
  canonical,
  name,
  profile,
  summary,
  quote,
  news,
  initialPeriod,
}: SymbolDetailProps) {
  const t = useTranslations("symbol");
  const { formatPrice, formatChangePercent, formatCompactNumber, formatDateTime } =
    useFormatters();
  const router = useRouter();

  const [period, setPeriod] = useState<ChartPeriod>(initialPeriod);
  const [syncedInitial, setSyncedInitial] = useState<ChartPeriod>(initialPeriod);

  // Geri/ileri gezinmede sunucudan gelen periyotla senkron kal. React'in
  // önerdiği "render sırasında prop değişimini ayarla" deseni; effect içinde
  // setState (cascading render) yerine tercih edilir.
  if (initialPeriod !== syncedInitial) {
    setSyncedInitial(initialPeriod);
    setPeriod(initialPeriod);
  }

  const handlePeriodChange = useCallback(
    (next: ChartPeriod) => {
      setPeriod(next);
      router.replace(buildSymbolHref(symbol, next), { scroll: false });
    },
    [router, symbol],
  );

  const isBist = kind === "bist";
  const currency = isBist ? (summary?.currency ?? profile?.currency ?? "TRY") : (quote?.currency ?? "TRY");

  const price = isBist
    ? (summary?.last_price ?? profile?.market.currentPrice ?? null)
    : (quote?.price ?? quote?.selling ?? quote?.buying ?? null);
  const change = isBist ? (summary?.change_pct ?? null) : (quote?.change_pct ?? null);
  const asOf = isBist ? (summary?.as_of ?? null) : (quote?.ts ?? null);
  const stale = isBist ? (summary?.is_stale ?? false) : (quote?.stale ?? false);
  const source = isBist ? null : (quote?.source ?? null);

  const description = isBist
    ? [profile?.sector, profile?.industry].filter(Boolean).join(" · ") || undefined
    : [quote?.unit, quote?.currency].filter(Boolean).join(" · ") || undefined;

  const overviewStats: ReactNode = isBist ? (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      <StatItem label={t("overview.price")} value={formatPrice(price)} />
      <StatItem
        label={t("overview.previousClose")}
        value={formatPrice(profile?.market.previousClose ?? summary?.previous_close ?? null)}
      />
      <StatItem
        label={t("overview.dayRange")}
        value={`${formatPrice(profile?.market.dayLow ?? summary?.day_low ?? null)} – ${formatPrice(
          profile?.market.dayHigh ?? summary?.day_high ?? null,
        )}`}
      />
      <StatItem
        label={t("overview.volume")}
        value={formatCompactNumber(profile?.market.regularMarketVolume ?? summary?.volume ?? null)}
      />
      <StatItem
        label={t("overview.marketCap")}
        value={formatCompactNumber(profile?.market.marketCap ?? summary?.market_cap ?? null)}
      />
      <StatItem
        label={t("overview.high52")}
        value={formatPrice(profile?.market.fiftyTwoWeekHigh ?? null)}
      />
      <StatItem
        label={t("overview.low52")}
        value={formatPrice(profile?.market.fiftyTwoWeekLow ?? null)}
      />
    </dl>
  ) : (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      <StatItem
        label={t("overview.price")}
        value={formatPrice(quote?.price ?? quote?.selling ?? quote?.buying ?? null)}
      />
      <StatItem label={t("overview.buying")} value={formatPrice(quote?.buying ?? null)} />
      <StatItem label={t("overview.selling")} value={formatPrice(quote?.selling ?? null)} />
      <StatItem label={t("overview.change")} value={formatChangePercent(quote?.change_pct ?? null)} />
      <StatItem label={t("overview.unit")} value={quote?.unit ?? "—"} />
      <StatItem label={t("overview.currency")} value={quote?.currency ?? "—"} />
      <StatItem label={t("overview.source")} value={quote?.source ?? "—"} />
    </dl>
  );

  const statsContent: ReactNode = isBist ? (
    <div className="flex flex-col gap-4">
      {profile ? (
        <>
          <StatsSection title={t("stats.valuation")}>
            <StatItem label={t("stats.pe")} value={formatPrice(profile.valuation.trailingPE)} />
            <StatItem label={t("stats.peForward")} value={formatPrice(profile.valuation.forwardPE)} />
            <StatItem label={t("stats.pb")} value={formatPrice(profile.valuation.priceToBook)} />
            <StatItem
              label={t("stats.dividendYield")}
              value={
                profile.valuation.dividendYield === null
                  ? "—"
                  : `${formatPrice(profile.valuation.dividendYield)}%`
              }
            />
            <StatItem
              label={t("stats.targetPrice")}
              value={formatPrice(profile.valuation.targetMeanPrice)}
            />
            <StatItem
              label={t("stats.analysts")}
              value={formatCompactNumber(profile.valuation.numberOfAnalystOpinions)}
            />
          </StatsSection>
          <StatsSection title={t("stats.financials")}>
            <StatItem
              label={t("stats.revenue")}
              value={formatCompactNumber(profile.financials.totalRevenue)}
            />
            <StatItem
              label={t("stats.netIncome")}
              value={formatCompactNumber(profile.financials.netIncomeToCommon)}
            />
            <StatItem
              label={t("stats.profitMargin")}
              value={
                profile.financials.profitMargins === null
                  ? "—"
                  : formatChangePercent(profile.financials.profitMargins * 100)
              }
            />
            <StatItem
              label={t("stats.grossMargin")}
              value={
                profile.financials.grossMargins === null
                  ? "—"
                  : formatChangePercent(profile.financials.grossMargins * 100)
              }
            />
            <StatItem label={t("stats.ebitda")} value={formatCompactNumber(profile.financials.ebitda)} />
            <StatItem
              label={t("stats.roe")}
              value={
                profile.financials.returnOnEquity === null
                  ? "—"
                  : formatChangePercent(profile.financials.returnOnEquity * 100)
              }
            />
          </StatsSection>
          <StatsSection title={t("stats.trading")}>
            <StatItem label={t("stats.beta")} value={formatPrice(profile.trading.beta)} />
            <StatItem label={t("stats.ma50")} value={formatPrice(profile.trading.fiftyDayAverage)} />
            <StatItem
              label={t("stats.ma200")}
              value={formatPrice(profile.trading.twoHundredDayAverage)}
            />
            <StatItem
              label={t("stats.avgVolume")}
              value={formatCompactNumber(profile.trading.averageVolume)}
            />
            <StatItem
              label={t("stats.sharesOutstanding")}
              value={formatCompactNumber(profile.trading.sharesOutstanding)}
            />
          </StatsSection>
          <StatsSection title={t("stats.balanceSheet")}>
            <StatItem label={t("stats.totalCash")} value={formatCompactNumber(profile.balanceSheet.totalCash)} />
            <StatItem label={t("stats.totalDebt")} value={formatCompactNumber(profile.balanceSheet.totalDebt)} />
            <StatItem label={t("stats.debtToEquity")} value={formatPrice(profile.balanceSheet.debtToEquity)} />
            <StatItem label={t("stats.currentRatio")} value={formatPrice(profile.balanceSheet.currentRatio)} />
            <StatItem label={t("stats.quickRatio")} value={formatPrice(profile.balanceSheet.quickRatio)} />
          </StatsSection>
        </>
      ) : (
        <EmptyState title={t("stats.empty")} />
      )}
    </div>
  ) : (
    <div className="flex flex-col gap-4">
      <StatsSection title={t("stats.quote")}>
        <StatItem label={t("overview.price")} value={formatPrice(quote?.price ?? null)} />
        <StatItem label={t("overview.buying")} value={formatPrice(quote?.buying ?? null)} />
        <StatItem label={t("overview.selling")} value={formatPrice(quote?.selling ?? null)} />
        <StatItem label={t("overview.change")} value={formatChangePercent(quote?.change_pct ?? null)} />
        <StatItem label={t("overview.unit")} value={quote?.unit ?? "—"} />
        <StatItem label={t("overview.currency")} value={quote?.currency ?? "—"} />
        <StatItem label={t("overview.source")} value={quote?.source ?? "—"} />
        <StatItem label={t("freshness.updated")} value={formatDateTime(quote?.ts)} />
      </StatsSection>
    </div>
  );

  const newsContent: ReactNode =
    news === null ? (
      <ErrorState
        title={t("news.error")}
        description={t("news.errorDescription")}
        retry={{ label: t("news.retry"), onRetry: () => router.refresh() }}
      />
    ) : news.length === 0 ? (
      <EmptyState title={t("news.empty")} />
    ) : (
      <ul className="flex flex-col gap-2">
        {news.map((article) => {
          const href = safeExternalUrl(article.url);
          return (
            <li key={article.url}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1 rounded-md border border-border bg-surface px-3 py-2 transition-colors duration-150 ease-out hover:bg-surface-hover"
                >
                  <span className="text-sm font-medium text-foreground">{article.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(article.date)}
                  </span>
                </a>
              ) : (
                <span className="block rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground">
                  {article.title}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );

  const tabItems = [
    { value: "overview", label: t("tabs.overview"), content: <Panel>{overviewStats}</Panel> },
    {
      value: "chart",
      label: t("tabs.chart"),
      content: (
        <Panel>
          <PriceChart
            symbol={canonical}
            kind={kind}
            period={period}
            onPeriodChange={handlePeriodChange}
          />
        </Panel>
      ),
    },
    { value: "stats", label: t("tabs.stats"), content: statsContent },
    ...(isBist
      ? [{ value: "news", label: t("tabs.news"), content: newsContent }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        backHref="/markets"
        backLabel={t("back")}
        title={
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono">{symbol}</span>
            {name !== symbol ? (
              <span className="text-base font-normal text-muted-foreground">{name}</span>
            ) : null}
          </span>
        }
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isBist ? (
              <MarketStatusPill />
            ) : (
              <Badge variant="neutral" title={t("market.economyNote")}>
                {t("market.economyBadge")}
              </Badge>
            )}
            {isBist ? <FavoriteToggle ticker={canonical} /> : null}
            <Link
              href="/portfolio"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
              <Wallet aria-hidden="true" className="size-4" />
              {t("tradeCta.label")}
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <PriceText value={price} suffix={currency} className="text-2xl font-semibold" />
        <Delta value={change} percent className="text-base" />
        <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {asOf
              ? t("freshness.asOf", { time: formatDateTime(asOf) })
              : t("freshness.unavailable")}
          </span>
          {stale ? <Badge variant="warning">{t("freshness.stale")}</Badge> : null}
          {source ? <span>{t("freshness.source", { source })}</span> : null}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">{t("tradeCta.note")}</p>

      <Tabs items={tabItems} defaultValue="overview" />
    </div>
  );
}

function StatsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{children}</dl>
    </section>
  );
}
