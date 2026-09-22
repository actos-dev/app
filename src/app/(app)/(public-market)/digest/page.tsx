/**
 * `/digest` — piyasa bülteni arşivi (Faz 5 / Birim 5A.3, U-08, S-15).
 *
 * Sunucu bileşeni: güncel bülten (tazelik rozetiyle) ve gün/slot gezgini
 * RSC'de çerez forward edilerek yüklenir. Gezinme durumu URL'dedir
 * (`?date=&slot=`); tarih/slot değişince sunucu yeniden render edilir, JS'siz
 * gezinme çalışır.
 *
 * Tazelik UYDURULMAZ: slot pencere sınırları backend config'indedir ve uç
 * nokta olarak açık değildir; bunun yerine backend'e "şu an hangi pencere?"
 * (`GET /digest?at=`) sorulur (`lib/digest/load.ts`). Bülten yoksa/backend
 * hatası varsa boş ve hata durumları ayrı gösterilir.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { DigestArchiveNav } from "@/components/digest/DigestArchiveNav";
import { DigestViewer } from "@/components/digest/DigestViewer";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/badge";
import { defaultLocale, isLocale } from "@/i18n/config";
import {
  digestHref,
  firstParam,
  isDigestSlot,
  isIsoDate,
  todayInIstanbul,
} from "@/lib/digest/digest";
import { loadCurrentDigest, loadDigestArchive, loadDigestBySlot } from "@/lib/digest/load";
import { DIGEST_SLOTS, type Digest, type DigestSlot } from "@/lib/digest/types";
import { formatDate } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const [t, app, locale] = await Promise.all([
    getTranslations("digest"),
    getTranslations("app"),
    getLocale(),
  ]);
  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: { canonical: "/digest" },
    openGraph: {
      type: "website",
      url: "/digest",
      siteName: app("name"),
      title,
      description,
      locale: locale === "tr" ? "tr_TR" : "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** O gün için gerçekten üretilmiş slotları kanonik sırayla döner. */
function availableSlots(digests: readonly Digest[]): DigestSlot[] {
  const present = new Set(digests.map((digest) => digest.slot));
  return DIGEST_SLOTS.filter((slot) => present.has(slot));
}

export default async function DigestPage({ searchParams }: PageProps<"/digest">) {
  const params = await searchParams;
  const rawDate = firstParam(params.date);
  const rawSlot = firstParam(params.slot);

  const today = todayInIstanbul();
  const date = isIsoDate(rawDate) ? rawDate : today;
  const slot = isDigestSlot(rawSlot) ? rawSlot : undefined;

  const [t, current, archive, selected, locale] = await Promise.all([
    getTranslations("digest"),
    loadCurrentDigest(),
    loadDigestArchive(date),
    slot ? loadDigestBySlot(date, slot) : Promise.resolve(null),
    getLocale(),
  ]);
  const activeLocale = isLocale(locale) ? locale : defaultLocale;

  const slots = availableSlots(archive.digests);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} />

      <Panel
        title={t("current.title")}
        actions={
          current.freshness === "current" ? (
            <Badge variant="positive">{t("current.fresh")}</Badge>
          ) : current.freshness === "stale" ? (
            <Badge variant="warning">{t("current.stale")}</Badge>
          ) : null
        }
      >
        {current.failed ? (
          <ErrorState
            title={t("current.errorTitle")}
            description={t("current.errorDescription")}
          />
        ) : current.digest ? (
          <div className="flex flex-col gap-3">
            {current.freshness === "stale" ? (
              <p className="rounded-md border border-border bg-surface-raised px-3 py-2 text-xs text-muted-foreground">
                {t("current.staleDetail", {
                  date: formatDate(current.digest.date, { locale: activeLocale }),
                  slot: t(`slot.${current.digest.slot}`),
                })}
              </p>
            ) : null}
            <DigestViewer digest={current.digest} />
          </div>
        ) : (
          <EmptyState
            title={t("current.emptyTitle")}
            description={t("current.emptyDescription")}
          />
        )}
      </Panel>

      <Panel title={t("archive.title")}>
        <div className="flex flex-col gap-4">
          <DigestArchiveNav
            date={date}
            {...(slot ? { slot } : {})}
            availableSlots={slots}
            today={today}
          />

          {slot && selected ? (
            selected.status === "ok" ? (
              <DigestViewer digest={selected.digest} />
            ) : selected.status === "not-found" ? (
              <EmptyState
                title={t("archive.slotEmptyTitle")}
                description={t("archive.slotEmptyDescription", {
                  date: formatDate(date, { locale: activeLocale }),
                  slot: t(`slot.${slot}`),
                })}
              />
            ) : (
              <ErrorState
                title={t("archive.errorTitle")}
                description={t("archive.errorDescription")}
              />
            )
          ) : archive.status === "error" ? (
            <ErrorState
              title={t("archive.errorTitle")}
              description={t("archive.errorDescription")}
            />
          ) : archive.digests.length === 0 ? (
            <EmptyState
              title={t("archive.emptyTitle")}
              description={t("archive.emptyDescription", {
                date: formatDate(date, { locale: activeLocale }),
              })}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">{t("archive.available")}</p>
              <ul className="flex flex-col gap-1">
                {slots.map((availableSlot) => (
                  <li key={availableSlot}>
                    <Link
                      href={digestHref(date, availableSlot)}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-border bg-surface-raised px-3 text-sm text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover md:min-h-9"
                    >
                      <span>{t(`slot.${availableSlot}`)}</span>
                      <span className="text-xs text-muted-foreground">{t("archive.open")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
