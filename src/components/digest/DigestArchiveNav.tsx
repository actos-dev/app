"use client";

/**
 * Bülten arşivi gezinme çubuğu (Faz 5 / Birim 5A.3, U-08).
 *
 * URL = state: tarih ve slot yalnızca adres çubuğunda tutulur; seçim
 * değişince `router.push` ile sunucu bileşeni yeniden render edilir (JS'siz
 * gezinme için bağlantılar da gerçek `<Link>`'dir). Gelecek tarihe gidilmez
 * (`max`/`next` kapısı): henüz üretilmemiş bülten boşuna istenmez.
 *
 * Slot sekmeleri ARIA `tablist` DEĞİL, gezinme bağlantılarıdır (panel
 * değişimi değil rota değişimi); bu yüzden `nav` + `aria-current` kullanılır.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { digestHref, isIsoDate, shiftIsoDate } from "@/lib/digest/digest";
import { DIGEST_SLOTS, type DigestSlot } from "@/lib/digest/types";
import { cn } from "@/lib/utils";

type DigestArchiveNavProps = {
  date: string;
  slot?: DigestSlot;
  /** Seçili günde gerçekten var olan slotlar. */
  availableSlots: readonly DigestSlot[];
  /** İstanbul'a göre bugün; gelecek tarih kapısı. */
  today: string;
};

export function DigestArchiveNav({ date, slot, availableSlots, today }: DigestArchiveNavProps) {
  const t = useTranslations("digest.archive");
  const tSlot = useTranslations("digest.slot");
  const router = useRouter();

  const previousDate = shiftIsoDate(date, -1);
  const nextDate = shiftIsoDate(date, 1);
  const canGoNext = nextDate <= today;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>{t("dateLabel")}</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(event) => {
              const next = event.target.value;
              if (isIsoDate(next)) {
                router.push(digestHref(next, slot));
              }
            }}
            className="h-11 rounded-md border border-border bg-surface px-2 text-sm text-foreground md:h-9"
          />
        </label>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label={t("previousDay")}
            onClick={() => router.push(digestHref(previousDate, slot))}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label={t("nextDay")}
            disabled={!canGoNext}
            onClick={() => {
              if (canGoNext) {
                router.push(digestHref(nextDate, slot));
              }
            }}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>

      <nav aria-label={t("slotsLabel")} className="flex flex-wrap items-center gap-1">
        {DIGEST_SLOTS.map((value) => {
          const available = availableSlots.includes(value);
          const active = value === slot;
          if (!available) {
            return (
              <span
                key={value}
                aria-disabled="true"
                className="inline-flex h-11 items-center rounded-md px-3 text-sm text-muted-foreground opacity-50 md:h-8"
              >
                {tSlot(value)}
              </span>
            );
          }
          return (
            <Link
              key={value}
              href={digestHref(date, value)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-11 items-center rounded-md px-3 text-sm transition-colors duration-150 ease-out md:h-8",
                active
                  ? "bg-surface-hover font-medium text-foreground"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
              )}
            >
              {tSlot(value)}
            </Link>
          );
        })}

        {slot ? (
          <Link
            href={digestHref(date)}
            className="ml-auto text-xs text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
          >
            {t("backToDay")}
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
