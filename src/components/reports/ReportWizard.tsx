"use client";

/**
 * Rapor üretim sihirbazı (Faz 5 / Birim 5A.1, U-03, U-06, U-09, S-03 bağlamı).
 *
 * Akış SENKRONdur (B-09 job altyapısı yok): `POST /reports/generate` tek
 * istektir ve 30-60 sn sürebilir. Bu yüzden:
 *   - sahte ilerleme yüzdesi yok; yalnız geçen süre + dürüst aşama metni,
 *   - üretim boyunca gönderim kilidi ve "sayfayı kapatmayın" uyarısı,
 *   - iptal vaadi YOK (backend iptal ucu yok).
 *
 * Kredi (U-03): bakiye `/credits`ten gelir; tahmini maliyet `/reports/info`
 * şemasından. Bakiye yetersizse gönderim BAŞTAN engellenir ve neden yazılır.
 * Amaç alanı (U-09) backend `purpose` parametresine gider; sınırı aşan girdi
 * istemcide durdurulur.
 */
import { FileText, Info, LoaderCircle, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useRequireAuth } from "@/components/auth/SessionProvider";
import { SymbolSearch } from "@/components/market/SymbolSearch";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCredits } from "@/hooks/useCredits";
import { useGenerateReport, useReportInfo } from "@/hooks/useReports";
import { useFormatters } from "@/lib/format";
import { normalizePurpose, PURPOSE_MAX_LENGTH, reportHref } from "@/lib/reports/report";
import type { CreditsResponse, ReportInfo, ReportType } from "@/lib/reports/types";

type ReportWizardProps = {
  /** RSC'den gelen rapor tipi/maliyet bilgisi; yoksa istemci çeker. */
  initialInfo?: ReportInfo;
  /** RSC'den gelen kredi bakiyesi; yoksa istemci çeker. */
  initialCredits?: CreditsResponse;
};

export function ReportWizard({ initialInfo, initialCredits }: ReportWizardProps) {
  const t = useTranslations("reports");
  const { formatPrice } = useFormatters();

  const infoQuery = useReportInfo(initialInfo);
  const creditsQuery = useCredits(initialCredits);
  const generate = useGenerateReport();
  const requireAuth = useRequireAuth();

  const [type, setType] = useState<ReportType | null>(null);
  const [ticker, setTicker] = useState("");
  const [tickerName, setTickerName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const info = infoQuery.data;
  const credits = creditsQuery.data?.credits;
  const isPending = generate.isPending;

  const formatCredits = (value: number) => formatPrice(value, { fractionDigits: 0 });

  const cost = type && info ? info[type].est_cost : null;
  const insufficient = cost !== null && credits !== undefined && credits < cost;
  const purposeTooLong = purpose.length > PURPOSE_MAX_LENGTH;
  const missingType = type === null;
  const missingTicker = ticker.trim().length === 0;
  const canSubmit =
    !isPending && !missingType && !missingTicker && !purposeTooLong && !insufficient && info !== undefined;

  // Üretim sürerken saniye sayacı; sayaç yalnız zamanlayıcı geri çağrısında
  // güncellenir (effect gövdesinde senkron setState yok). Gönderim anında
  // `elapsed` sıfırlanır; gösterim yalnız `isPending` iken yapılır.
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

  const typeOptions: SelectOption<ReportType>[] = info
    ? (["quick_report", "deep_report"] as const).map((value) => ({
        value,
        label: `${t(`type.${value}`)} · ${t("credits.value", { credits: formatCredits(info[value].est_cost) })}`,
      }))
    : [];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 5C / X-04: anonimde üretim başlatılmaz; login'e yönlendirilir.
    requireAuth(() => {
      setShowValidation(true);
      if (!type || missingTicker || purposeTooLong || insufficient) {
        return;
      }
      setElapsed(0);
      const normalizedPurpose = normalizePurpose(purpose);
      generate.mutate({
        ticker: ticker.trim().toUpperCase(),
        type,
        ...(normalizedPurpose ? { purpose: normalizedPurpose } : {}),
      });
    });
  };

  const generated = generate.data;

  return (
    <Panel
      title={t("wizard.title")}
      actions={
        info ? (
          <span className="text-xs text-muted-foreground">
            {t("credits.label")}: {credits === undefined ? "—" : formatCredits(credits)}
          </span>
        ) : null
      }
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <p className="text-sm text-muted-foreground">{t("wizard.description")}</p>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label={t("wizard.typeLabel")}
            required
            error={showValidation && missingType ? t("wizard.errors.typeRequired") : undefined}
          >
            {(control) => (
              <Select<ReportType>
                {...control}
                aria-label={t("wizard.typeLabel")}
                value={type}
                onValueChange={(value) => setType(value)}
                options={typeOptions}
                placeholder={t("wizard.typePlaceholder")}
                disabled={isPending || info === undefined}
              />
            )}
          </FormField>

          <FormField
            label={t("wizard.symbolLabel")}
            hint={t("wizard.symbolHint")}
            required
            error={showValidation && missingTicker ? t("wizard.symbolRequired") : undefined}
          >
            {(control) => (
              <SymbolSearch
                id={control.id}
                aria-describedby={control["aria-describedby"]}
                aria-invalid={control["aria-invalid"]}
                placeholder={t("wizard.symbolLabel")}
                onSelect={(nextTicker, name) => {
                  setTicker(nextTicker);
                  setTickerName(name);
                }}
              />
            )}
          </FormField>
        </div>

        {ticker ? (
          <div className="flex items-center gap-2" data-testid="selected-symbol">
            <Badge variant="info">
              <FileText aria-hidden="true" className="size-3.5" />
              {ticker}
            </Badge>
            {tickerName ? <span className="truncate text-sm text-muted-foreground">{tickerName}</span> : null}
          </div>
        ) : null}

        <FormField
          label={t("wizard.purposeLabel")}
          hint={t("wizard.purposeHint", { max: PURPOSE_MAX_LENGTH })}
          error={purposeTooLong ? t("wizard.purposeTooLong", { max: PURPOSE_MAX_LENGTH }) : undefined}
        >
          {(control) => (
            <Textarea
              {...control}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              maxLength={PURPOSE_MAX_LENGTH + 1}
              placeholder={t("wizard.purposePlaceholder")}
              disabled={isPending}
            />
          )}
        </FormField>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-raised px-3 py-2">
          <span className="text-sm text-muted-foreground">{t("wizard.costLabel")}</span>
          <span className="text-sm font-medium text-foreground" data-testid="estimated-cost">
            {cost === null ? t("wizard.costPending") : t("credits.value", { credits: formatCredits(cost) })}
          </span>
        </div>

        {creditsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground" role="status">
            {t("credits.loading")}
          </p>
        ) : null}

        {insufficient && cost !== null && credits !== undefined ? (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-border bg-surface-raised px-3 py-2">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-foreground">
                {t("credits.insufficient", {
                  cost: formatCredits(cost),
                  balance: formatCredits(credits),
                })}
              </p>
              <p className="text-xs text-muted-foreground">{t("credits.insufficientHint")}</p>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!canSubmit} loading={isPending}>
            {isPending ? null : <Sparkles aria-hidden="true" className="size-4" />}
            {t("wizard.submit")}
          </Button>
          {isPending ? (
            <span className="text-sm text-muted-foreground" role="status">
              {t("wizard.generating.elapsed", { seconds: elapsed })}
            </span>
          ) : null}
        </div>

        {isPending ? (
          <div role="status" className="flex flex-col gap-1 rounded-md border border-border bg-surface-raised px-3 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              {t("wizard.generating.title")}
            </p>
            <p className="text-sm text-muted-foreground">{t("wizard.generating.stage")}</p>
            <p className="text-xs text-muted-foreground">{t("wizard.generating.warning")}</p>
            <p className="text-xs text-muted-foreground">{t("wizard.generating.noCancel")}</p>
          </div>
        ) : null}

        {generated && !isPending ? (
          <div role="status" className="flex flex-col gap-2 rounded-md border border-border bg-surface-raised px-3 py-3">
            <p className="text-sm font-medium text-foreground">{t("wizard.success.title")}</p>
            <p className="text-xs text-muted-foreground">
              {t("wizard.success.cost", { cost: formatCredits(generated.credits_spend) })} ·{" "}
              {t("wizard.success.remaining", { credits: formatCredits(generated.remaining_credits) })}
            </p>
            <Link
              href={reportHref(generated.report_id)}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
            >
              <Info aria-hidden="true" className="size-4" />
              {t("wizard.success.view")}
            </Link>
          </div>
        ) : null}
      </form>
    </Panel>
  );
}
