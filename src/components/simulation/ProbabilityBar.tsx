"use client";

/**
 * Olasılık göstergesi (Faz 5 / Birim 5A.2).
 *
 * Yalnız renge bırakılmaz: yüzde metni ve erişilebilir ad (`role="progressbar"`
 * + `aria-valuenow`) eşlik eder; renk tonu `probabilityTone` ile seçilir ve
 * token'lardan gelir. Dolgu genişliği satır içi `style` iledir (dinamik ölçü
 * Tailwind sınıfına sığmaz); renk sınıfı yine token'dır.
 */
import { cn } from "@/lib/utils";

type ProbabilityBarProps = {
  /** `0..1` aralığında olasılık; geçersizse boş gösterilir. */
  value: number | null;
  tone: "positive" | "negative" | "neutral";
  /** Ekran okuyucu için çubuğun neyi temsil ettiği. */
  label: string;
  /** Yüzde metni (biçimlendirilmiş). */
  valueLabel: string;
  className?: string;
};

const TONE_FILL: Record<ProbabilityBarProps["tone"], string> = {
  positive: "bg-positive",
  negative: "bg-negative",
  neutral: "bg-muted-foreground",
};

const TONE_TEXT: Record<ProbabilityBarProps["tone"], string> = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-foreground",
};

export function ProbabilityBar({ value, tone, label, valueLabel, className }: ProbabilityBarProps) {
  const percent = value === null ? null : Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("font-mono text-2xl font-semibold tabular-nums", TONE_TEXT[tone])}>
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
        className="h-2 overflow-hidden rounded-full bg-surface-raised"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-out", TONE_FILL[tone])}
          style={{ width: `${percent ?? 0}%` }}
        />
      </div>
    </div>
  );
}
