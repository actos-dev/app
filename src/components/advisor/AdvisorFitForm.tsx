"use client";

/**
 * Danışman — hisse önerisi formu (Faz 5 / Birim 5A.2).
 *
 * `POST /stocks/fit` gövdesi backend `FitRequest` şemasıyla birebir uyumludur
 * (`horizon`, `profitability`, `risk_tolerance`, `limit`). Analiz kredi
 * HARCAZ; bu yüzden kredi ön kontrolü yoktur ve bu durum kullanıcıya açıkça
 * yazılır. Sonuçlar `AdvisorFitResults` ile gösterilir.
 *
 * Bakım: `maintenanceBlocked` iken gönderim baştan engellenir ve net bir
 * bakım uyarısı gösterilir (eski uygulamadaki sessiz başarısızlık tekrarlanmaz).
 */
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AdvisorFitResults } from "@/components/advisor/AdvisorFitResults";
import { Panel } from "@/components/shared/Panel";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select, type SelectOption } from "@/components/ui/select";
import { useAdvisorFit } from "@/hooks/useAdvisor";
import { ApiError } from "@/lib/api/client";
import {
  ADVISOR_DEFAULT_LIMIT,
  ADVISOR_MAX_LIMIT,
  ADVISOR_MIN_LIMIT,
  isAdvisorHorizon,
  isAdvisorProfitability,
  isAdvisorRiskTolerance,
} from "@/lib/advisor/advisor";
import type {
  AdvisorHorizon,
  AdvisorProfitability,
  AdvisorRiskTolerance,
} from "@/lib/advisor/types";
import { isMaintenanceError, translateBackendError } from "@/lib/backend-errors";
import { ErrorState } from "@/components/shared/ErrorState";

/** `limit` seçenekleri (backend 1-100; UI'da okunur birkaç değer). */
const LIMIT_OPTIONS = [3, 5, 10, 20, 50] as const;

type AdvisorFitFormProps = {
  /** Backend `advisor` özelliği bakımda mı? */
  maintenanceBlocked: boolean;
};

export function AdvisorFitForm({ maintenanceBlocked }: AdvisorFitFormProps) {
  const t = useTranslations("advisor");
  // API hata kodları `apiErrors.*` kökündedir; scoped `t` çözemez (B-07).
  const tRoot = useTranslations();

  const [horizon, setHorizon] = useState<AdvisorHorizon>("long");
  const [profitability, setProfitability] = useState<AdvisorProfitability>("high");
  const [riskTolerance, setRiskTolerance] = useState<AdvisorRiskTolerance>("medium");
  const [limit, setLimit] = useState<number>(ADVISOR_DEFAULT_LIMIT);
  const [submitted, setSubmitted] = useState(false);

  const query = useAdvisorFit(
    { horizon, profitability, riskTolerance, limit },
    submitted && !maintenanceBlocked,
  );

  const horizonOptions: SelectOption<AdvisorHorizon>[] = [
    { value: "short", label: t("levels.horizon.short") },
    { value: "medium", label: t("levels.horizon.medium") },
    { value: "long", label: t("levels.horizon.long") },
  ];
  const profitabilityOptions: SelectOption<AdvisorProfitability>[] = [
    { value: "low", label: t("levels.profitability.low") },
    { value: "medium", label: t("levels.profitability.medium") },
    { value: "high", label: t("levels.profitability.high") },
  ];
  const riskOptions: SelectOption<AdvisorRiskTolerance>[] = [
    { value: "low", label: t("levels.risk.low") },
    { value: "medium", label: t("levels.risk.medium") },
    { value: "high", label: t("levels.risk.high") },
  ];
  const limitOptions: SelectOption<string>[] = LIMIT_OPTIONS.filter(
    (value) => value >= ADVISOR_MIN_LIMIT && value <= ADVISOR_MAX_LIMIT,
  ).map((value) => ({ value: String(value), label: String(value) }));

  const error = query.error;
  const errorKey =
    error instanceof ApiError ? translateBackendError(error.code) : "apiErrors.generic";

  return (
    <div className="flex flex-col gap-4">
      <Panel title={t("fit.title")}>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (maintenanceBlocked) {
              return;
            }
            if (submitted) {
              void query.refetch();
            } else {
              setSubmitted(true);
            }
          }}
        >
          <p className="text-sm text-muted-foreground">{t("fit.description")}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t("fit.horizon")}>
              {(control) => (
                <Select<AdvisorHorizon>
                  {...control}
                  aria-label={t("fit.horizon")}
                  value={horizon}
                  onValueChange={(value) => {
                    if (value && isAdvisorHorizon(value)) {
                      setHorizon(value);
                    }
                  }}
                  options={horizonOptions}
                />
              )}
            </FormField>

            <FormField label={t("fit.profitability")}>
              {(control) => (
                <Select<AdvisorProfitability>
                  {...control}
                  aria-label={t("fit.profitability")}
                  value={profitability}
                  onValueChange={(value) => {
                    if (value && isAdvisorProfitability(value)) {
                      setProfitability(value);
                    }
                  }}
                  options={profitabilityOptions}
                />
              )}
            </FormField>

            <FormField label={t("fit.riskTolerance")}>
              {(control) => (
                <Select<AdvisorRiskTolerance>
                  {...control}
                  aria-label={t("fit.riskTolerance")}
                  value={riskTolerance}
                  onValueChange={(value) => {
                    if (value && isAdvisorRiskTolerance(value)) {
                      setRiskTolerance(value);
                    }
                  }}
                  options={riskOptions}
                />
              )}
            </FormField>

            <FormField label={t("fit.limit")} hint={t("fit.limitHint")}>
              {(control) => (
                <Select<string>
                  {...control}
                  aria-label={t("fit.limit")}
                  value={String(limit)}
                  onValueChange={(value) => {
                    const parsed = Number(value);
                    if (Number.isInteger(parsed) && parsed >= ADVISOR_MIN_LIMIT && parsed <= ADVISOR_MAX_LIMIT) {
                      setLimit(parsed);
                    }
                  }}
                  options={limitOptions}
                />
              )}
            </FormField>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={maintenanceBlocked}
              loading={query.isFetching && !query.isError}
            >
              <Search aria-hidden="true" className="size-4" />
              {t("fit.submit")}
            </Button>
            <span className="text-xs text-muted-foreground">{t("fit.noCredits")}</span>
          </div>
        </form>
      </Panel>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">
          {t("results.title")}…
        </p>
      ) : null}

      {query.isError ? (
        <ErrorState
          title={t("errors.genericTitle")}
          description={
            isMaintenanceError(error instanceof ApiError ? error : null)
              ? t("maintenance.description")
              : errorKey === "apiErrors.generic"
                ? t("errors.genericDescription")
                : tRoot(errorKey)
          }
          retry={{ label: t("errors.retry"), onRetry: () => void query.refetch() }}
        />
      ) : null}

      {query.data && !query.isError ? (
        <AdvisorFitResults results={query.data.results} />
      ) : null}
    </div>
  );
}
