"use client";

/**
 * Topbar duyuru zili (Faz 5 / Birim 5B.3, A-02, A-03).
 *
 * `GET /announcements` listesini popover'da gösterir; okunmamış varsa
 * tetikleyiciye sayaç badge'i ve `role="status"` canlı bölgesi eklenir.
 * "Okundu olarak işaretle" `POST /announcements/read` çağırır (tüm duyuruları
 * okundu yapar) ve liste iyimser güncellenir.
 *
 * Erişilebilirlik: tetikleyici `aria-label` taşır (sayaç dahil), popover
 * `Popover.Title` ile adlandırılır; Base UI Escape/odak tuzağını yönetir.
 * Sunucu bileşeni ilk veriyi `initialData` ile tohumlar (AppShell).
 */
import { Popover } from "@base-ui/react/popover";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnouncements, useMarkAnnouncementsRead } from "@/hooks/useAnnouncements";
import { countUnread, type AnnouncementListResponse } from "@/lib/announcements/types";
import { useFormatters } from "@/lib/format";

type AnnouncementBellProps = {
  /** RSC'den gelen ilk duyuru listesi; yoksa istemci çeker. */
  initialAnnouncements?: AnnouncementListResponse;
};

export function AnnouncementBell({ initialAnnouncements }: AnnouncementBellProps) {
  const t = useTranslations("announcements");
  const { formatDateTime } = useFormatters();
  const query = useAnnouncements(initialAnnouncements);
  const markRead = useMarkAnnouncementsRead();

  const announcements = query.data?.announcements ?? [];
  const unread = countUnread(announcements);
  const label = unread > 0 ? t("bellUnread", { count: unread }) : t("bellLabel");

  return (
    <>
      {/* Yeni sayı, popover kapalıyken de ekran okuyucuya duyurulur (A-03). */}
      <span role="status" className="sr-only">
        {unread > 0 ? t("newCount", { count: unread }) : ""}
      </span>
      <Popover.Root>
        <Popover.Trigger
          render={
            <Button variant="ghost" size="icon" aria-label={label} className="relative">
              <Bell aria-hidden="true" className="size-5" />
              {unread > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 text-xs font-semibold leading-none text-negative-foreground tabular-nums"
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Button>
          }
        />
        <Popover.Portal>
          <Popover.Positioner sideOffset={6} align="end" className="z-50">
            <Popover.Popup className="flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-1 rounded-lg border border-border bg-surface-raised p-1 shadow-pop transition-[opacity,transform] duration-150 ease-out data-starting-style:scale-98 data-starting-style:opacity-0 data-ending-style:scale-98 data-ending-style:opacity-0">
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <Popover.Title className="text-sm font-semibold text-foreground">
                  {t("title")}
                </Popover.Title>
              </div>

              {query.isLoading ? (
              <div className="flex flex-col gap-2 p-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ) : query.isError ? (
              <div className="flex flex-col gap-2 p-2">
                <p role="alert" className="text-sm text-negative">
                  {t("errorTitle")}
                </p>
                <Button type="button" variant="secondary" size="sm" onClick={() => void query.refetch()}>
                  {t("retry")}
                </Button>
              </div>
            ) : announcements.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">{t("emptyDescription")}</p>
            ) : (
              <ul className="flex max-h-80 flex-col overflow-y-auto">
                {announcements.map((announcement) => (
                  <li
                    key={announcement.id}
                    className="flex flex-col gap-1 rounded-md px-2 py-2 hover:bg-surface-hover"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {announcement.title}
                      </span>
                      {announcement.is_unread ? (
                        <Badge variant="info">{t("unread")}</Badge>
                      ) : null}
                    </div>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      {announcement.content}
                    </p>
                    <time
                      dateTime={announcement.created_at}
                      className="text-xs text-muted-foreground"
                    >
                      {formatDateTime(announcement.created_at)}
                    </time>
                  </li>
                ))}
              </ul>
            )}

            {unread > 0 && !query.isError ? (
              <div className="p-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  loading={markRead.isPending}
                  onClick={() => markRead.mutate()}
                >
                  {t("markRead")}
                </Button>
              </div>
            ) : null}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
    </>
  );
}
