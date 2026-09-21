"use client";

/**
 * "Geçmiş" analiz sekmesi (Faz 4 / Birim 4.3, D-06, P-12).
 *
 * Portföy değeri zaman serisini `history` ucundan çeker ve alan grafiğiyle
 * çizer. Grafik `next/dynamic({ ssr: false })` ile ayrı chunk'tan, yalnız bu
 * sekme açıldığında yüklenir; ilk yüke grafik kodu girmez.
 */
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolioHistory } from "@/hooks/usePortfolios";
import { DEFAULT_ANALYTICS_PERIOD, type AnalyticsPeriod } from "@/lib/portfolio/periods";

import { AnalyticsEmpty, AnalyticsError } from "./parts";

const PortfolioValueChart = dynamic(
  () => import("../PortfolioValueChart").then((module) => module.PortfolioValueChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  const t = useTranslations("portfolio.analytics.history");
  return (
    <div className="flex flex-col gap-2" role="status">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-72 w-full md:h-80" />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}

type HistoryTabProps = { portfolioId: string };

export function HistoryTab({ portfolioId }: HistoryTabProps) {
  const t = useTranslations("portfolio.analytics.history");
  const [period, setPeriod] = useState<AnalyticsPeriod>(DEFAULT_ANALYTICS_PERIOD);
  const query = usePortfolioHistory(portfolioId, period);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>

      {query.isLoading ? <ChartSkeleton /> : null}
      {query.isError ? <AnalyticsError onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.length === 0 ? (
        <AnalyticsEmpty title={t("empty")} description={t("emptyHint")} />
      ) : null}
      {query.data && query.data.length > 0 ? (
        <PortfolioValueChart points={query.data} period={period} onPeriodChange={setPeriod} />
      ) : null}
    </div>
  );
}
