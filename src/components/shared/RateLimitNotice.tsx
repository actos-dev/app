/**
 * 429 uyarısı (plan X-07, S-11, B-14).
 *
 * Public okuma uçları IP bazlı limitlenir; sunucu bileşeni `429` aldığında bu
 * uyarı gösterilir. `Retry-After` varsa bekleme süresi de yazılır. `role="alert"`
 * ile ekran okuyucuya duyurulur; sayfa çökmez, yalnız bilgilendirir.
 */
import { TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";

type RateLimitNoticeProps = {
  /** Sunucunun verdiği bekleme süresi (saniye); yoksa `null`. */
  retryAfter: number | null;
  className?: string;
};

export async function RateLimitNotice({ retryAfter, className }: RateLimitNoticeProps) {
  const t = await getTranslations("rateLimit");
  const hasDelay = retryAfter !== null && retryAfter > 0;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3",
        className,
      )}
    >
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-foreground">{t("title")}</p>
        <p className="text-xs text-muted-foreground">
          {hasDelay ? t("retryAfter", { seconds: retryAfter }) : t("description")}
        </p>
      </div>
    </div>
  );
}
