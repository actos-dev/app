"use client";

/**
 * Simülasyon çalıştırma formu (Faz 5 / Birim 5A.2, U-03, U-06).
 *
 * Akış SENKRONdur (B-09 job altyapısı yok): `GET /simulations/{ticker}` tek
 * istektir ve dakikalarca sürebilir (backend job slot'u 600 sn). Bu yüzden:
 *   - sahte ilerleme yüzdesi yok; yalnız geçen süre + dürüst aşama metni,
 *   - çalıştırma boyunca gönderim kilidi ve "sayfayı kapatmayın" uyarısı,
 *   - iptal vaadi YOK (backend iptal ucu yok; kredi yalnız hata/iade yolu var).
 *
 * Kredi (U-03): maliyet `per-day-cost`/`estimate-cost` şemasından, bakiye
 * `/credits`ten gelir. Bakiye yetersizse gönderim BAŞTAN engellenir ve neden
 * yazılır. Koşu başarısızsa backend krediyi iade eder; UI bunu net söyler.
 *
 * `bounds` anlamı `lib/simulations/simulation.ts` başında açıklanmıştır:
 * atılan kuyruk olasılığı; seçenekler %90/%95/%99 olarak sunulur.
 */
import { FlaskConical, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { SymbolSearch } from "@/components/market/SymbolSearch";
import { MaintenanceNotice } from "@/components/shared/MaintenanceNotice";
import { Panel } from "@/components/shared/Panel";
import { SimulationResultView } from "@/components/simulation/SimulationResultView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { useMaintenance } from "@/hooks/useMaintenance";
import {
  useRunSimulation,
  useSimulationCredits,
  useSimulationEstimate,
  useSimulationPerDayCost,
} from "@/hooks/useSimulations";
import { ApiError } from "@/lib/api/client";
import { isMaintenanceError, translateBackendError } from "@/lib/backend-errors";
import { useFormatters } from "@/lib/format";
import {
  SIMULATION_BOUNDS_OPTIONS,
  SIMULATION_DEFAULT_BOUNDS,
  SIMULATION_DEFAULT_DAYS,
  SIMULATION_MAX_DAYS,
  SIMULATION_MIN_DAYS,
  isValidSimulationDays,
  normalizeTarget,
  type SimulationBounds,
} from "@/lib/simulations/simulation";
import type { PerDayCostResponse, SimulationCreditsResponse } from "@/lib/simulations/types";

type SimulationFormProps = {
  /** RSC'den gelen maliyet şeması; yoksa istemci çeker. */
  initialPerDayCost?: PerDayCostResponse;
  /** RSC'den gelen kredi bakiyesi; yoksa istemci çeker. */
  initialCredits?: SimulationCreditsResponse;
};

export function SimulationForm({ initialPerDayCost, initialCredits }: SimulationFormProps) {
  const t = useTranslations("simulation");
  // API hata kodları `apiErrors.*` kökündedir; scoped `t` çözemez (B-07).
  const tRoot = useTranslations();
  const { formatPrice } = useFormatters();

  const costSchema = useSimulationPerDayCost(initialPerDayCost);
  const creditsQuery = useSimulationCredits(initialCredits);
  const maintenance = useMaintenance();
  const run = useRunSimulation();

  const [ticker, setTicker] = useState("");
  const [daysInput, setDaysInput] = useState(String(SIMULATION_DEFAULT_DAYS));
  const [bounds, setBounds] = useState<SimulationBounds>(SIMULATION_DEFAULT_BOUNDS);
  const [targetInput, setTargetInput] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Bakım iki kaynaktan gelebilir: `/maintenance` listesi veya koşu 503'ü.
  const runMaintenance =
    run.error instanceof ApiError && isMaintenanceError({ status: run.error.status, code: run.error.code });
  const maintenanceBlocked = maintenance.isDisabled("simulation") || runMaintenance;

  const normalizedTicker = ticker.trim().toUpperCase();
  const days = Number(daysInput);
  const daysValid = isValidSimulationDays(days);

  const estimate = useSimulationEstimate(
    normalizedTicker,
    daysValid ? days : 0,
    daysValid && normalizedTicker.length > 0,
  );

  // Tahmini maliyet: `estimate-cost` yanıtı öncelikli; uç henüz dönmediyse
  // gün başına maliyet şemasından yerel olarak hesaplanır (aynı formül). Sembol
  // seçilmeden maliyet gösterilmez.
  const perDayCost = costSchema.data?.per_day_cost ?? null;
  const roundTo = costSchema.data?.round ?? 3;
  const localCost =
    perDayCost !== null && daysValid && normalizedTicker.length > 0
      ? Number((days * perDayCost).toFixed(roundTo))
      : null;
  const cost = estimate.data?.cost ?? localCost;

  const credits = creditsQuery.data?.credits;
  const insufficient = cost !== null && credits !== undefined && credits < cost;

  const normalizedTarget = normalizeTarget(targetInput);
  const targetInvalid = normalizedTarget === undefined;

  const missingTicker = normalizedTicker.length === 0;
  const isPending = run.isPending;

  const canSubmit =
    !isPending &&
    !maintenanceBlocked &&
    !missingTicker &&
    daysValid &&
    !targetInvalid &&
    !insufficient &&
    cost !== null;

  // Çalışma sürerken saniye sayacı; sayaç yalnız zamanlayıcı geri çağrısında
  // güncellenir (effect gövdesinde senkron setState yok).
  useEffect(() => {
    if (!isPending) {
      return;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPending]);

  const boundsOptions: SelectOption<SimulationBounds>[] = SIMULATION_BOUNDS_OPTIONS.map(
    (option) => ({
      value: option.value,
      label: t("form.boundsOption", { percent: option.percent, bounds: option.value }),
    }),
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowValidation(true);
    if (!canSubmit) {
      return;
    }
    setElapsed(0);
    run.mutate({
      ticker: normalizedTicker,
      days,
      bounds,
      ...(normalizedTarget ? { target: normalizedTarget } : {}),
    });
  };

  const result = run.data;

  return (
    <Panel title={t("run.title")} actions={
      <span className="text-xs text-muted-foreground">
        {t("cost.balanceLabel")}: {credits === undefined ? "—" : t("cost.value", { credits: formatPrice(credits, { fractionDigits: 0 }) })}
      </span>
    }>
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        {maintenanceBlocked ? (
          <MaintenanceNotice
            title={t("maintenance.title")}
            description={t("maintenance.description")}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label={t("form.symbolLabel")}
            hint={t("form.symbolHint")}
            required
            error={showValidation && missingTicker ? t("form.symbolRequired") : undefined}
          >
            {(control) => (
              <SymbolSearch
                id={control.id}
                aria-describedby={control["aria-describedby"]}
                aria-invalid={control["aria-invalid"]}
                placeholder={t("form.symbolLabel")}
                onSelect={(nextTicker) => {
                  setTicker(nextTicker);
                }}
              />
            )}
          </FormField>

          <FormField
            label={t("form.daysLabel")}
            hint={t("form.daysHint")}
            required
            error={showValidation && !daysValid ? t("form.daysRequired") : undefined}
          >
            {(control) => (
              <Input
                {...control}
                type="number"
                inputMode="numeric"
                min={SIMULATION_MIN_DAYS}
                max={SIMULATION_MAX_DAYS}
                value={daysInput}
                onChange={(event) => setDaysInput(event.target.value)}
                disabled={isPending}
              />
            )}
          </FormField>

          <FormField label={t("form.boundsLabel")} hint={t("form.boundsHint")}>
            {(control) => (
              <Select<SimulationBounds>
                {...control}
                aria-label={t("form.boundsLabel")}
                value={bounds}
                onValueChange={(value) => {
                  if (value) {
                    setBounds(value);
                  }
                }}
                options={boundsOptions}
                disabled={isPending}
              />
            )}
          </FormField>

          <FormField
            label={t("form.targetLabel")}
            hint={t("form.targetHint")}
            error={showValidation && targetInvalid ? t("form.targetInvalid") : undefined}
          >
            {(control) => (
              <Input
                {...control}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={targetInput}
                onChange={(event) => setTargetInput(event.target.value)}
                placeholder={t("form.targetPlaceholder")}
                disabled={isPending}
              />
            )}
          </FormField>
        </div>

        {normalizedTicker ? (
          <div className="flex items-center gap-2" data-testid="selected-symbol">
            <Badge variant="info">
              <FlaskConical aria-hidden="true" className="size-3.5" />
              {normalizedTicker}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t("form.daysValue", { days: daysValid ? days : 0 })}
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-raised px-3 py-2">
          <span className="text-sm text-muted-foreground">{t("cost.estimateLabel")}</span>
          <span className="text-sm font-medium text-foreground" data-testid="estimated-cost">
            {cost === null
              ? t("cost.estimatePending")
              : t("cost.value", { credits: formatPrice(cost, { fractionDigits: roundTo }) })}
          </span>
        </div>

        {perDayCost !== null ? (
          <p className="text-xs text-muted-foreground">
            {t("cost.perDay", { cost: formatPrice(perDayCost, { fractionDigits: roundTo }) })}
          </p>
        ) : null}

        {creditsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground" role="status">
            {t("cost.loading")}
          </p>
        ) : null}

        {insufficient && cost !== null && credits !== undefined ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-border bg-surface-raised px-3 py-2"
          >
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-foreground">
                {t("cost.insufficient", {
                  cost: formatPrice(cost, { fractionDigits: roundTo }),
                  balance: formatPrice(credits, { fractionDigits: 0 }),
                })}
              </p>
              <p className="text-xs text-muted-foreground">{t("cost.insufficientHint")}</p>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!canSubmit} loading={isPending}>
            {isPending ? null : <FlaskConical aria-hidden="true" className="size-4" />}
            {t("run.submit")}
          </Button>
          {isPending ? (
            <span className="text-sm text-muted-foreground" role="status">
              {t("run.running.elapsed", { seconds: elapsed })}
            </span>
          ) : null}
        </div>

        {isPending ? (
          <div
            role="status"
            className="flex flex-col gap-1 rounded-md border border-border bg-surface-raised px-3 py-3"
          >
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              {t("run.running.title")}
            </p>
            <p className="text-sm text-muted-foreground">{t("run.running.stage")}</p>
            <p className="text-xs text-muted-foreground">{t("run.running.warning")}</p>
            <p className="text-xs text-muted-foreground">{t("run.running.noCancel")}</p>
          </div>
        ) : null}

        {result && !isPending ? (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-md border border-border bg-surface-raised px-3 py-3"
            data-testid="simulation-result"
          >
            <p className="text-sm font-medium text-foreground">{t("run.success.title")}</p>
            <SimulationResultView result={result} />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info aria-hidden="true" className="size-3.5" />
              {t("result.remainingLabel")}:{" "}
              {t("cost.value", { credits: formatPrice(result.remaining_credits, { fractionDigits: 0 }) })}
            </p>
          </div>
        ) : null}

        {run.isError && !runMaintenance && !isPending ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-border bg-surface-raised px-3 py-2"
          >
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-negative" />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-foreground">
                {tRoot(
                  run.error instanceof ApiError
                    ? translateBackendError(run.error.code)
                    : "apiErrors.generic",
                )}
              </p>
              <p className="text-xs text-muted-foreground">{t("errors.failed")}</p>
            </div>
          </div>
        ) : null}
      </form>
    </Panel>
  );
}
