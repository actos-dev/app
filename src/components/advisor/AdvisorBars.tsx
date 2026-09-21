"use client";

/**
 * Danışman bar göstergeleri (Faz 5 / Birim 5A.2).
 *
 * `ScoreBar` tek bir skoru/kaliteyi gösterir; `VectorBars` `risk/horizon/
 * profitability` üçlüsünü küçük sütunlarla çizer. Her ikisi de yalnız renge
 * bırakmaz: yüzde metni ve ekran okuyucu adı eşlik eder. Renkler token'dır.
 */
import { cn } from "@/lib/utils";

import { barTone, type BarTone } from "@/lib/advisor/advisor";

const TONE_FILL: Record<BarTone, string> = {
  positive: "bg-positive",
  neutral: "bg-muted-foreground",
  negative: "bg-negative",
};

const TONE_TEXT: Record<BarTone, string> = {
  positive: "text-positive",
  neutral: "text-foreground",
  negative: "text-negative",
};

type ScoreBarProps = {
  /** `0..1` kalite; geçersizse `null`. */
  value: number | null;
  label: string;
  /** Erişilebilir değer metni (ör. "%72"). */
  valueLabel: string;
  className?: string;
};

/** Yatay dolgu çubuğu (uygunluk skoru gibi tek değer için). */
export function ScoreBar({ value, label, valueLabel, className }: ScoreBarProps) {
  const percent =
    value === null ? null : Math.round(Math.min(Math.max(value, 0), 1) * 100);
  const tone = barTone(value);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-mono font-semibold tabular-nums", TONE_TEXT[tone])}>
          {valueLabel}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
        aria-valuetext={valueLabel}
        className="h-1.5 overflow-hidden rounded-full bg-surface-raised"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-out", TONE_FILL[tone])}
          style={{ width: `${percent ?? 0}%` }}
        />
      </div>
    </div>
  );
}

type VectorBarsProps = {
  /** `[risk, horizon, profitability]`; eksik/geçersiz değerler boş kalır. */
  vector: readonly number[];
  /** İndeks başına etiket (sırayla risk, vade, kârlılık). */
  labels: readonly [string, string, string];
  className?: string;
};

/** Üçlü dikey sütun: risk / vade / kârlılık profili. */
export function VectorBars({ vector, labels, className }: VectorBarsProps) {
  return (
    <div className={cn("flex items-end gap-2", className)}>
      {labels.map((label, index) => {
        const raw = vector[index];
        const value = typeof raw === "number" && Number.isFinite(raw)
          ? Math.min(Math.max(raw, 0), 1)
          : null;
        const percent = value === null ? 0 : Math.round(value * 100);
        const tone = barTone(value);
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              role="progressbar"
              aria-label={label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value === null ? undefined : percent}
              aria-valuetext={`${percent}%`}
              className="flex h-10 w-full items-end overflow-hidden rounded-md bg-surface-raised"
            >
              <div
                className={cn("w-full rounded-t-sm transition-[height] duration-500 ease-out", TONE_FILL[tone])}
                style={{ height: `${percent}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
