"use client";

/**
 * Danışman öneri kartı (Faz 5 / Birim 5A.2).
 *
 * `POST /stocks/fit` ve `POST /portfolio/profile` aynı `{ticker, vector,
 * score, distance}` şeklini döner; tek kart ikisini de çizer. Sembol detayına
 * `/symbol/{ticker}` bağlantısı verilir (typedRoutes).
 */
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { ScoreBar, VectorBars } from "@/components/advisor/AdvisorBars";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/shared/Panel";
import { advisorResultHref, scorePercent } from "@/lib/advisor/advisor";
import { useFormatters } from "@/lib/format";
import type { AdvisorFitResult } from "@/lib/advisor/types";

type AdvisorResultCardProps = {
  result: AdvisorFitResult;
  /** Sıra numarası (1 tabanlı); başlıkta gösterilir. */
  rank: number;
};

export function AdvisorResultCard({ result, rank }: AdvisorResultCardProps) {
  const t = useTranslations("advisor");
  const { formatPrice } = useFormatters();
  const percent = scorePercent(result.score);

  return (
    <Panel contentClassName="p-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-raised font-mono text-xs font-semibold text-foreground">
          {rank}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link
                href={advisorResultHref(result.ticker)}
                className="font-mono font-semibold text-primary hover:text-primary-hover"
              >
                {result.ticker}
              </Link>
              <Badge variant="info">
                <Sparkles aria-hidden="true" className="size-3" />
                {t("results.scoreValue", { percent: percent ?? 0 })}
              </Badge>
            </div>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {t("results.distanceLabel")}: {formatPrice(result.distance, { fractionDigits: 3 })}
            </span>
          </div>

          <ScoreBar
            value={result.score}
            label={t("results.scoreLabel")}
            valueLabel={t("results.scoreValue", { percent: percent ?? 0 })}
          />

          <VectorBars
            vector={result.vector}
            labels={[t("vector.risk"), t("vector.horizon"), t("vector.profitability")]}
            className="pt-1"
          />
        </div>
      </div>
    </Panel>
  );
}
