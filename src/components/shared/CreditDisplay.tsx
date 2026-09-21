"use client";

/**
 * Kredi göstergesi (Faz 5 / Birim 5A.3, U-03).
 *
 * Bakiye `GET /credits`ten gelir; RSC ilk değeri `initialCredits` ile
 * tohumlar. Düşük bakiye yalnızca renk + tooltip metniyle ayırt edilir; kural
 * (günlük dolum, tavan) backend config'inde olduğundan UI'da TEKRARLANMAZ.
 * Harcama geçmişi B-05 (kredi defteri) olmadığından gösterilmez.
 *
 * Tooltip Base UI'dan gelir ve dokunmatikte kapalıdır; bu yüzden bilgi ayrıca
 * görünür metne/erişilebilir adına gömülmez, yalnız `sr-only` etiketle
 * zenginleştirilir.
 */
import { Coins } from "lucide-react";
import { useTranslations } from "next-intl";

import { Tooltip } from "@/components/ui/tooltip";
import { isLowCredit, useCredits } from "@/hooks/useCredits";
import { EMPTY_VALUE, useFormatters } from "@/lib/format";
import { cn } from "@/lib/utils";

type CreditDisplayProps = {
  /** RSC'den gelen bakiye; yoksa istemci çeker. */
  initialCredits?: number;
  className?: string;
};

export function CreditDisplay({ initialCredits, className }: CreditDisplayProps) {
  const t = useTranslations("credits");
  const { formatPrice } = useFormatters();
  const query = useCredits(
    initialCredits === undefined ? undefined : { credits: initialCredits },
  );

  const credits = query.data?.credits;
  const low = isLowCredit(credits);

  return (
    <Tooltip content={low ? `${t("tooltip")} ${t("lowHint")}` : t("tooltip")}>
      <span
        tabIndex={0}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm",
          className,
        )}
      >
        <Coins
          aria-hidden="true"
          className={cn("size-4 shrink-0", low ? "text-warning" : "text-primary")}
        />
        <span className="sr-only">{t("label")}</span>
        <span
          className={cn(
            "font-mono font-semibold tabular-nums",
            low ? "text-warning" : "text-foreground",
          )}
        >
          {credits === undefined ? EMPTY_VALUE : formatPrice(credits, { fractionDigits: 0 })}
        </span>
      </span>
    </Tooltip>
  );
}
