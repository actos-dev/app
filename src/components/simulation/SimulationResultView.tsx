"use client";

/**
 * Simülasyon sonuç görünümü (Faz 5 / Birim 5A.2).
 *
 * Hem senkron koşunun yanıtını (`SimulationResult`) hem geçmiş detayını
 * (`SimulationHistoryDetail`) aynı okunur dille gösterir: yön farkındalıklı
 * olasılık çubuğu, güven aralığı bandı ve kredi muhasebesi. Tüm sayılar
 * `format.ts` üzerinden biçimlenir; renk token'dan gelir ve metinle çift
 * kodlanır (erişilebilirlik).
 *
 * `avgb` (ort. kapanış) grafiği YOKTUR: `GET /simulations/{ticker}` ham fiyat
 * yollarını döndürmez (yalnız final dağılımın özetleri). Sahte bir fan grafiği
 * çizmek yerine özetler dürüstçe gösterilir.
 */
import { Target, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { ProbabilityBar } from "@/components/simulation/ProbabilityBar";
import { Badge } from "@/components/ui/badge";
import {
  confidencePercent,
  confidenceRange,
  directionalProbability,
  probabilityTone,
  targetNumber,
} from "@/lib/simulations/simulation";
import type { SimulationDirection, SimulationHistoryDetail } from "@/lib/simulations/types";
import { useFormatters } from "@/lib/format";

type SimulationResultLike = {
  ticker: string;
  days: number;
  target: string;
  bounds: string;
  prob_above?: number;
  prob_below?: number;
  direction?: SimulationDirection;
  confidence?: {
    min: number;
    max: number;
    percent: number;
    days: number;
    bounds: string;
  };
  credits_spend?: number;
  remaining_credits?: number;
};

type SimulationResultViewProps = {
  result: SimulationResultLike;
  /** Kredi satırları yalnız canlı koşuda gösterilir (geçmişte maliyet ayrıdır). */
  showCredits?: boolean;
};

export function SimulationResultView({ result, showCredits = true }: SimulationResultViewProps) {
  const t = useTranslations("simulation.result");
  const { formatPrice } = useFormatters();

  const direction: SimulationDirection = result.direction === "below" ? "below" : "above";
  const probability = directionalProbability({
    direction,
    prob_above: result.prob_above,
    prob_below: result.prob_below,
  });
  const tone = probabilityTone(probability, direction);
  const range = confidenceRange(result.confidence ?? null);
  const percent = confidencePercent(result.confidence?.bounds ?? result.bounds);
  const target = targetNumber(result.target);

  const probabilityLabel =
    target === null
      ? t("probabilityAutoLabel")
      : direction === "below"
        ? t("probabilityBelowLabel")
        : t("probabilityLabel");

  const summaryDirection = direction === "below" ? t("directionBelow") : t("directionAbove");
  const summaryTarget = target === null ? t("targetAuto") : t("targetValue", { target: formatPrice(target) });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target aria-hidden="true" className="size-4 text-primary" />
          <span className="font-mono text-sm font-semibold text-foreground">{result.ticker}</span>
        </div>
        <Badge variant={direction === "below" ? "negative" : "info"}>
          {direction === "below" ? (
            <TrendingDown aria-hidden="true" className="size-3.5" />
          ) : (
            <TrendingUp aria-hidden="true" className="size-3.5" />
          )}
          {direction === "below" ? t("directionBadgeBelow") : t("directionBadgeAbove")}
        </Badge>
      </div>

      <ProbabilityBar
        value={probability}
        tone={tone}
        label={probabilityLabel}
        valueLabel={probability === null ? "—" : `%${formatPrice(probability * 100, { fractionDigits: 0 })}`}
      />

      <p className="text-xs text-muted-foreground" data-testid="simulation-summary">
        {t("summary", {
          ticker: result.ticker,
          days: result.days,
          target: summaryTarget,
          direction: summaryDirection,
        })}
      </p>

      {range ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-raised px-3 py-2">
          <span className="text-xs text-muted-foreground">
            {t("confidenceTitle", { percent: percent ?? 0 })}
          </span>
          <div className="flex items-center justify-center gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">{t("confidenceLower")}</p>
              <p className="font-mono text-base font-semibold tabular-nums text-negative">{formatPrice(range.min)}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">{t("confidenceUpper")}</p>
              <p className="font-mono text-base font-semibold tabular-nums text-positive">{formatPrice(range.max)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("confidenceMeta", { bounds: result.bounds, days: result.days })}
          </p>
        </div>
      ) : null}

      {showCredits ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">{t("costLabel")}</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatPrice(result.credits_spend ?? null, { fractionDigits: 0 })}
          </span>
        </div>
      ) : null}

      <Link
        href={`/symbol/${result.ticker}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
      >
        <TrendingUp aria-hidden="true" className="size-4" />
        {t("viewSymbol", { ticker: result.ticker })}
      </Link>
    </div>
  );
}

/** Geçmiş detayını sonuç görünümüne çevirir (yön kayıpta yoksa "above"). */
export function toResultLike(detail: SimulationHistoryDetail): SimulationResultLike {
  return {
    ticker: detail.ticker,
    days: detail.days,
    target: detail.target,
    bounds: detail.bounds,
    prob_above: detail.result.prob_above,
    prob_below: detail.result.prob_below,
    direction: detail.result.direction === "below" ? "below" : "above",
    confidence: detail.result.confidence,
  };
}
