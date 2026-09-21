"use client";

/**
 * Danışman portföy profili sonuçları (Faz 5 / Birim 5A.2).
 *
 * Üç blok: tahmini profil (sözel etiketler), kullanıcının portföyündeki
 * hisselerin vektörleri ve popüler evrenden benzer hisseler (`AdvisorFitResult`
 * ile aynı kart şekli). `estimated_profile` backend'de en yakın seviyeye
 * yuvarlanır; burada i18n etiketine çevrilir.
 */
import { useTranslations } from "next-intl";

import { AdvisorResultCard } from "@/components/advisor/AdvisorResultCard";
import { VectorBars } from "@/components/advisor/AdvisorBars";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/badge";
import type { AdvisorPortfolioResponse } from "@/lib/advisor/types";

type AdvisorPortfolioResultsProps = {
  data: AdvisorPortfolioResponse;
};

export function AdvisorPortfolioResults({ data }: AdvisorPortfolioResultsProps) {
  const t = useTranslations("advisor");

  const profile = data.estimated_profile;

  return (
    <section className="flex flex-col gap-4" aria-label={t("profile.title")}>
      <Panel title={t("profile.avgTitle")}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="neutral">
              {t("vector.horizon")}: {t(`levels.horizon.${profile.horizon}`)}
            </Badge>
            <Badge variant="neutral">
              {t("vector.profitability")}: {t(`levels.profitability.${profile.profitability}`)}
            </Badge>
            <Badge variant="neutral">
              {t("vector.risk")}: {t(`levels.risk.${profile.risk}`)}
            </Badge>
          </div>
          <VectorBars
            vector={data.avg_vector}
            labels={[t("vector.risk"), t("vector.horizon"), t("vector.profitability")]}
          />
        </div>
      </Panel>

      <Panel title={t("profile.portfolioTitle")}>
        {data.portfolio.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("portfolio.empty")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.portfolio.map((item) => (
              <div
                key={item.ticker}
                className="flex flex-col gap-2 rounded-md border border-border bg-surface-raised px-3 py-2"
              >
                <span className="font-mono text-sm font-semibold text-foreground">{item.ticker}</span>
                <VectorBars
                  vector={item.vector}
                  labels={[t("vector.risk"), t("vector.horizon"), t("vector.profitability")]}
                />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title={t("profile.similarTitle")}>
        {data.similar_stocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("profile.noSimilar")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.similar_stocks.map((result, index) => (
              <AdvisorResultCard key={result.ticker} result={result} rank={index + 1} />
            ))}
          </div>
        )}
      </Panel>
    </section>
  );
}
