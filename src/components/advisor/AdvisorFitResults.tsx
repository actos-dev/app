"use client";

/**
 * Danışman hisse önerisi sonuçları (Faz 5 / Birim 5A.2).
 *
 * `POST /stocks/fit` yanıtındaki `results` listesini sırayla çizer. Boş liste
 * ayrı bir boş durumdur; backend popüler evrenden veri bulamazsa görülebilir.
 */
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdvisorResultCard } from "@/components/advisor/AdvisorResultCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { sortAdvisorResults } from "@/lib/advisor/advisor";
import type { AdvisorFitResult } from "@/lib/advisor/types";

type AdvisorFitResultsProps = {
  results: readonly AdvisorFitResult[];
};

export function AdvisorFitResults({ results }: AdvisorFitResultsProps) {
  const t = useTranslations("advisor");

  const sorted = sortAdvisorResults(results);

  return (
    <section className="flex flex-col gap-3" aria-label={t("results.title")}>
      <h2 className="text-sm font-semibold text-foreground">{t("results.title")}</h2>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Search aria-hidden="true" className="size-5" />}
          title={t("results.emptyTitle")}
          description={t("results.emptyDescription")}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground" role="status">
            {t("results.count", { count: sorted.length })}
          </p>
          <div className="flex flex-col gap-3">
            {sorted.map((result, index) => (
              <AdvisorResultCard key={result.ticker} result={result} rank={index + 1} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
