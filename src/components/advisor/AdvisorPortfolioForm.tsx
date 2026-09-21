"use client";

/**
 * Danışman — portföy profili formu (Faz 5 / Birim 5A.2).
 *
 * `POST /portfolio/profile` gövdesi backend `PortfolioProfileRequest` şemasıyla
 * birebir uyumludur (`tickers: string[]`, `limit`; 1-50 ticker, 1-50 limit).
 * Hisse seçimi `SymbolSearch` ile yapılır; seçilenler rozet olarak listelenir
 * ve tek tek kaldırılabilir. Kredi HARCAZ (backend kredi muhasebesinden muaf).
 *
 * Aynı hisse iki kez eklenmez; sınıra ulaşınca uyarı verilir. Boş liste
 * gönderilmez (backend 422); buton kilitlidir.
 */
import { Shield, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useRequireAuth } from "@/components/auth/SessionProvider";
import { AdvisorPortfolioResults } from "@/components/advisor/AdvisorPortfolioResults";
import { SymbolSearch } from "@/components/market/SymbolSearch";
import { Panel } from "@/components/shared/Panel";
import { ErrorState } from "@/components/shared/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select, type SelectOption } from "@/components/ui/select";
import { useAdvisorPortfolioProfile } from "@/hooks/useAdvisor";
import { ApiError } from "@/lib/api/client";
import {
  ADVISOR_MAX_PORTFOLIO_TICKERS,
  normalizeAdvisorTicker,
} from "@/lib/advisor/advisor";
import { isMaintenanceError, translateBackendError } from "@/lib/backend-errors";

/** Öneri sayısı seçenekleri (backend 1-50). */
const PORTFOLIO_LIMIT_OPTIONS = [3, 5, 10, 20] as const;

type AdvisorPortfolioFormProps = {
  maintenanceBlocked: boolean;
};

export function AdvisorPortfolioForm({ maintenanceBlocked }: AdvisorPortfolioFormProps) {
  const t = useTranslations("advisor");
  // API hata kodları `apiErrors.*` kökündedir; scoped `t` çözemez (B-07).
  const tRoot = useTranslations();

  const [tickers, setTickers] = useState<string[]>([]);
  const [limit, setLimit] = useState<number>(5);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const query = useAdvisorPortfolioProfile(tickers, limit, submitted && !maintenanceBlocked);
  const requireAuth = useRequireAuth();

  const limitOptions: SelectOption<string>[] = PORTFOLIO_LIMIT_OPTIONS.map((value) => ({
    value: String(value),
    label: String(value),
  }));

  const addTicker = (rawTicker: string) => {
    const ticker = normalizeAdvisorTicker(rawTicker);
    if (ticker.length === 0) {
      return;
    }
    if (tickers.includes(ticker)) {
      setNotice(t("portfolio.duplicate", { ticker }));
      return;
    }
    if (tickers.length >= ADVISOR_MAX_PORTFOLIO_TICKERS) {
      setNotice(t("portfolio.maxReached", { max: ADVISOR_MAX_PORTFOLIO_TICKERS }));
      return;
    }
    setNotice(null);
    setTickers((current) => [...current, ticker]);
  };

  const removeTicker = (ticker: string) => {
    setNotice(null);
    setTickers((current) => current.filter((item) => item !== ticker));
  };

  const error = query.error;
  const errorKey = error instanceof ApiError ? translateBackendError(error.code) : "apiErrors.generic";

  return (
    <div className="flex flex-col gap-4">
      <Panel title={t("portfolio.title")}>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            // 5C / X-04: anonimde analiz başlatılmaz; login'e yönlendirilir.
            requireAuth(() => {
              if (maintenanceBlocked || tickers.length === 0) {
                return;
              }
              if (submitted) {
                void query.refetch();
              } else {
                setSubmitted(true);
              }
            });
          }}
        >
          <p className="text-sm text-muted-foreground">{t("portfolio.description")}</p>

          <FormField label={t("portfolio.symbolLabel")} hint={t("portfolio.count", { count: tickers.length, max: ADVISOR_MAX_PORTFOLIO_TICKERS })}>
            {(control) => (
              <SymbolSearch
                id={control.id}
                aria-describedby={control["aria-describedby"]}
                placeholder={t("portfolio.addTicker")}
                onSelect={(ticker) => {
                  addTicker(ticker);
                }}
              />
            )}
          </FormField>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">{t("portfolio.selected")}</span>
            {tickers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("portfolio.empty")}</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {tickers.map((ticker) => (
                  <li key={ticker}>
                    <Badge variant="neutral" className="gap-1 pr-1">
                      <span className="font-mono">{ticker}</span>
                      <button
                        type="button"
                        onClick={() => removeTicker(ticker)}
                        aria-label={t("portfolio.remove", { ticker })}
                        className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-foreground"
                      >
                        <X aria-hidden="true" className="size-3" />
                      </button>
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            {notice ? (
              <p role="status" className="text-xs text-warning">
                {notice}
              </p>
            ) : null}
          </div>

          <FormField label={t("portfolio.limit")} hint={t("portfolio.limitHint")}>
            {(control) => (
              <Select<string>
                {...control}
                aria-label={t("portfolio.limit")}
                value={String(limit)}
                onValueChange={(value) => {
                  const parsed = Number(value);
                  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 50) {
                    setLimit(parsed);
                  }
                }}
                options={limitOptions}
              />
            )}
          </FormField>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={maintenanceBlocked || tickers.length === 0}>
              <Shield aria-hidden="true" className="size-4" />
              {t("portfolio.submit")}
            </Button>
            <span className="text-xs text-muted-foreground">{t("fit.noCredits")}</span>
          </div>
        </form>
      </Panel>

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

      {query.data && !query.isError ? <AdvisorPortfolioResults data={query.data} /> : null}
    </div>
  );
}
