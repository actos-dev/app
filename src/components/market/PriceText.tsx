"use client";

/**
 * Fiyat metni (plan D-03, S-14).
 *
 * Sayılar `font-mono` + `tabular-nums` ile hizalanır; biçim aktif locale'den
 * gelir. Para birimi/simge `suffix` ile verilir ve geçersiz değerde gösterilmez.
 */
import { memo } from "react";

import { EMPTY_VALUE, useFormatters } from "@/lib/format";
import { cn } from "@/lib/utils";

type PriceTextProps = {
  value: number | null | undefined;
  /** Sayıdan sonra gelen sonek, ör. `"₺"` veya `"TRY"`. */
  suffix?: string;
  /** Ondalık basamak sayısı; verilmezse 2. */
  fractionDigits?: number;
  className?: string;
};

function PriceTextImpl({ value, suffix, fractionDigits, className }: PriceTextProps) {
  const { formatPrice } = useFormatters();
  const text = formatPrice(value, fractionDigits === undefined ? {} : { fractionDigits });
  const showSuffix = suffix !== undefined && suffix.length > 0 && text !== EMPTY_VALUE;

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {text}
      {showSuffix ? <span className="ml-1 text-muted-foreground">{suffix}</span> : null}
    </span>
  );
}

export const PriceText = memo(PriceTextImpl);
