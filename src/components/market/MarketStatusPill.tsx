"use client";

/**
 * Piyasa durumu rozeti (plan B-01, U-04, S-15).
 *
 * Zengin `/market/status` payload'ını kullanır: açık/kapalı, resmî tatil adı ve
 * `next_open_at`. Sunucudan gelen anlık veri `initialData` ile geçilebilir;
 * böylece ilk boyama istemci isteği beklemez.
 *
 * İpucu (tooltip) dokunmatikte görünmediği için aynı bilgi `aria-label`'a da
 * yazılır; kritik bilgi yalnız hover'a bırakılmaz.
 */
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { useFormatters } from "@/lib/format";
import { useMarketStatus } from "@/lib/query/polling";
import { cn } from "@/lib/utils";
import type { MarketStatus } from "@/types/market";

type MarketStatusPillProps = {
  /** Sunucu bileşeninden (SSR) gelen başlangıç verisi. */
  initialData?: MarketStatus;
  className?: string;
};

export function MarketStatusPill({ initialData, className }: MarketStatusPillProps) {
  const t = useTranslations("market.status");
  const { formatDateTime } = useFormatters();
  const { data } = useMarketStatus(initialData ? { initialData } : {});

  const open = data?.open ?? false;
  const holidayName = data?.holiday_name ?? null;
  const nextOpenLabel = data?.next_open_at ? formatDateTime(data.next_open_at) : null;

  const label = open ? t("open") : t("closed");
  const detail = open
    ? t("openDetail")
    : holidayName
      ? t("holidayDetail", { name: holidayName })
      : nextOpenLabel
        ? t("nextOpenDetail", { time: nextOpenLabel })
        : t("closedDetail");

  return (
    <Tooltip content={detail}>
      <Badge
        variant={open ? "positive" : "neutral"}
        aria-label={`${label}. ${detail}`}
        className={cn("gap-1.5", className)}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            open ? "bg-positive-foreground" : "bg-muted-foreground",
          )}
        />
        {label}
      </Badge>
    </Tooltip>
  );
}
