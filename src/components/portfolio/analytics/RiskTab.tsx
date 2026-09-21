"use client";

/**
 * "Risk" analiz sekmesi (Faz 4 / Birim 4.3).
 *
 * Backend volatilite ve max drawdown'u yüzde, Sharpe'ı oransız döner; sayısal
 * açıklamalar i18n'den gelir. Geçmiş üç noktadan kısaysa tüm alanlar `null`
 * olur ve zarif boş durum gösterilir.
 */
import { useTranslations } from "next-intl";

import { PriceText } from "@/components/market/PriceText";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolioRisk } from "@/hooks/usePortfolios";
import { DEFAULT_RISK_PERIOD } from "@/lib/portfolio/periods";

import { AnalyticsEmpty, AnalyticsError, AnalyticsStat, AnalyticsStatGrid } from "./parts";

type RiskTabProps = { portfolioId: string };

export function RiskTab({ portfolioId }: RiskTabProps) {
  const t = useTranslations("portfolio.analytics");
  const query = usePortfolioRisk(portfolioId, DEFAULT_RISK_PERIOD);

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <AnalyticsError onRetry={() => void query.refetch()} />;
  }

  const risk = query.data;
  const empty =
    risk.volatility === null && risk.max_drawdown === null && risk.sharpe_ratio === null;

  if (empty) {
    return <AnalyticsEmpty title={t("risk.empty")} description={t("risk.emptyHint")} />;
  }

  return (
    <AnalyticsStatGrid>
      <AnalyticsStat label={t("risk.volatility")} hint={t("risk.volatilityHint")}>
        <PriceText value={risk.volatility} suffix="%" />
      </AnalyticsStat>
      <AnalyticsStat label={t("risk.maxDrawdown")} hint={t("risk.maxDrawdownHint")}>
        <PriceText value={risk.max_drawdown} suffix="%" />
      </AnalyticsStat>
      <AnalyticsStat label={t("risk.sharpe")} hint={t("risk.sharpeHint")}>
        <PriceText value={risk.sharpe_ratio} fractionDigits={2} />
      </AnalyticsStat>
    </AnalyticsStatGrid>
  );
}
