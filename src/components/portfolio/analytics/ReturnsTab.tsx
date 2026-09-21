"use client";

/**
 * "Getiri" analiz sekmesi (Faz 4 / Birim 4.3).
 *
 * Üç ucu birlikte kullanır: `returns` (dönem getirisi + CAGR), `benchmark`
 * (XU100 kıyası) ve `performance` (işlem verimliliği). Yalnız bu sekme
 * açıldığında mount edilir; kapalıyken bu uçlara istek atılmaz.
 */
import { useTranslations } from "next-intl";

import { Delta } from "@/components/market/Delta";
import { PriceText } from "@/components/market/PriceText";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePortfolioBenchmark,
  usePortfolioPerformance,
  usePortfolioReturns,
} from "@/hooks/usePortfolios";
import { DEFAULT_ANALYTICS_PERIOD } from "@/lib/portfolio/periods";

import { AnalyticsEmpty, AnalyticsError, AnalyticsStat, AnalyticsStatGrid } from "./parts";

/** Yükleniyor iskeleti; istatistik ızgarasıyla aynı ritmi korur. */
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  );
}

type ReturnsTabProps = { portfolioId: string };

export function ReturnsTab({ portfolioId }: ReturnsTabProps) {
  const t = useTranslations("portfolio.analytics");
  const returns = usePortfolioReturns(portfolioId, DEFAULT_ANALYTICS_PERIOD);
  const benchmark = usePortfolioBenchmark(portfolioId);
  const performance = usePortfolioPerformance(portfolioId);

  const bench = benchmark.data;
  const hasBenchmark =
    bench !== undefined &&
    (typeof bench.portfolio_return_pct === "number" ||
      typeof bench.benchmark_return_pct === "number");

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">{t("returns.title")}</h3>
        {returns.isLoading ? <StatsSkeleton /> : null}
        {returns.isError ? <AnalyticsError onRetry={() => void returns.refetch()} /> : null}
        {returns.data ? (
          <AnalyticsStatGrid>
            <AnalyticsStat label={t("returns.startValue")}>
              <PriceText value={returns.data.start_value} />
            </AnalyticsStat>
            <AnalyticsStat label={t("returns.endValue")}>
              <PriceText value={returns.data.end_value} />
            </AnalyticsStat>
            <AnalyticsStat label={t("returns.absoluteReturn")}>
              <Delta value={returns.data.absolute_return} />
            </AnalyticsStat>
            <AnalyticsStat label={t("returns.totalReturn")}>
              <Delta value={returns.data.total_return_percentage} percent />
            </AnalyticsStat>
            <AnalyticsStat label={t("returns.cagr")} hint={t("returns.cagrHint")}>
              <Delta value={returns.data.cagr_percentage} percent />
            </AnalyticsStat>
          </AnalyticsStatGrid>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">{t("benchmark.title")}</h3>
        {benchmark.isLoading ? <StatsSkeleton /> : null}
        {benchmark.isError ? (
          <AnalyticsError onRetry={() => void benchmark.refetch()} />
        ) : null}
        {!benchmark.isLoading && !benchmark.isError && !hasBenchmark ? (
          <AnalyticsEmpty
            title={t("benchmark.empty")}
            description={t("benchmark.emptyHint")}
          />
        ) : null}
        {hasBenchmark && bench ? (
          <div className="flex flex-col gap-3">
            <AnalyticsStatGrid>
              <AnalyticsStat label={t("benchmark.portfolioReturn")}>
                <Delta value={bench.portfolio_return_pct} percent />
              </AnalyticsStat>
              <AnalyticsStat
                label={t("benchmark.benchmarkReturn", {
                  ticker: bench.benchmark_ticker ?? "XU100",
                })}
              >
                <Delta value={bench.benchmark_return_pct} percent />
              </AnalyticsStat>
              <AnalyticsStat label={t("benchmark.difference")}>
                <Delta value={bench.difference_pct} percent />
              </AnalyticsStat>
            </AnalyticsStatGrid>
            <p>
              <Badge variant={bench.outperformed ? "positive" : "negative"}>
                {bench.outperformed ? t("benchmark.outperformed") : t("benchmark.underperformed")}
              </Badge>
            </p>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">{t("performance.title")}</h3>
        {performance.isLoading ? <StatsSkeleton /> : null}
        {performance.isError ? (
          <AnalyticsError onRetry={() => void performance.refetch()} />
        ) : null}
        {performance.data && performance.data.overall === null ? (
          <AnalyticsEmpty
            title={t("performance.empty")}
            description={t("performance.emptyHint")}
          />
        ) : null}
        {performance.data?.overall ? (
          <AnalyticsStatGrid>
            <AnalyticsStat label={t("performance.efficiency")} hint={t("performance.efficiencyHint")}>
              <PriceText
                value={
                  performance.data.overall.efficiency_score === null
                    ? null
                    : performance.data.overall.efficiency_score * 100
                }
                suffix="%"
                fractionDigits={0}
              />
            </AnalyticsStat>
            <AnalyticsStat label={t("performance.actualPnl")}>
              <Delta value={performance.data.overall.actual_pnl} />
            </AnalyticsStat>
            <AnalyticsStat label={t("performance.optimalPnl")} hint={t("performance.optimalPnlHint")}>
              <Delta value={performance.data.overall.optimal_pnl} />
            </AnalyticsStat>
          </AnalyticsStatGrid>
        ) : null}
      </section>
    </div>
  );
}
