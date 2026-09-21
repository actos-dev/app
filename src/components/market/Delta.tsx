"use client";

/**
 * Değişim göstergesi (plan K-03, §3.1 ilke 3).
 *
 * Renk + ok + işaret ile ÇİFT kodlama yapılır: yalnız renge bırakılmaz, renk
 * körü kullanıcı yönü oktan ve işaretten okur. Görünen metin `aria-hidden`'dır;
 * erişilebilir ad (`aria-label`) i18n'den gelir ve değeri de içerir.
 */
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";

import { useFormatters } from "@/lib/format";
import { cn } from "@/lib/utils";

type DeltaProps = {
  value: number | null | undefined;
  /** Değeri yüzde olarak göster (ör. `change_pct`). */
  percent?: boolean;
  className?: string;
};

type Direction = "up" | "down" | "flat" | "unavailable";

const DIRECTION_ICONS = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
  unavailable: null,
} as const;

const DIRECTION_TONES: Record<Direction, string> = {
  up: "text-positive",
  down: "text-negative",
  flat: "text-muted-foreground",
  unavailable: "text-muted-foreground",
};

function DeltaImpl({ value, percent = false, className }: DeltaProps) {
  const t = useTranslations("market.delta");
  const { formatChangePercent, formatChangeValue } = useFormatters();

  const numeric = typeof value === "number" && Number.isFinite(value) ? value : null;
  const direction: Direction =
    numeric === null ? "unavailable" : numeric > 0 ? "up" : numeric < 0 ? "down" : "flat";
  const formatted = percent
    ? formatChangePercent(numeric)
    : formatChangeValue(numeric);

  const ariaLabel =
    direction === "unavailable"
      ? t("aria.unavailable")
      : direction === "flat"
        ? t("aria.flat")
        : t(`aria.${direction}`, { value: formatted });

  const Icon = DIRECTION_ICONS[direction];

  return (
    <span
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 font-mono tabular-nums",
        DIRECTION_TONES[direction],
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      <span aria-hidden="true">{formatted}</span>
    </span>
  );
}

export const Delta = memo(DeltaImpl);
