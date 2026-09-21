"use client";

/**
 * Bülten önizleme widget'ı (Faz 5B / Birim 5B.1, P-05, U-08, S-03).
 *
 * Güncel bülten RSC'den gelir; önizleme yalnızca ilk dolu bölümün (yoksa
 * gövdenin) kısaltılmış halidir ve paylaşılan `Markdown` ile SANITIZE edilerek
 * render edilir (AI üretimi içerik XSS yüzeyi). Tam bülten ve arşiv `/digest`
 * sayfasındadır.
 */
import { Newspaper } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { Markdown } from "@/components/shared/Markdown";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useFormatters } from "@/lib/format";
import type { Digest } from "@/lib/digest/types";

/** Önizlemede gösterilen azami karakter; tam bülten `/digest`'te. */
const PREVIEW_MAX_LENGTH = 320;

type DigestPreviewWidgetProps = {
  digest: Digest | null;
  failed: boolean;
  className?: string;
};

/** Markdown'ı bozmadan kelime sınırında kısaltır. */
function previewText(source: string): string {
  const trimmed = source.trim();
  if (trimmed.length <= PREVIEW_MAX_LENGTH) {
    return trimmed;
  }
  const cut = trimmed.slice(0, PREVIEW_MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : PREVIEW_MAX_LENGTH).trimEnd()}…`;
}

export function DigestPreviewWidget({ digest, failed, className }: DigestPreviewWidgetProps) {
  const t = useTranslations("dashboard.digest");
  const tDigest = useTranslations("digest");
  const { formatDateTime } = useFormatters();

  const preview = useMemo(() => {
    if (!digest) {
      return "";
    }
    const section = digest.sections.find((item) => item.body.trim().length > 0);
    return previewText(section?.body ?? digest.content);
  }, [digest]);

  return (
    <Panel
      title={t("title")}
      className={className}
      actions={
        <Link
          href={"/digest" as Route}
          className="text-xs text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
        >
          {t("viewArchive")}
        </Link>
      }
    >
      {failed ? (
        <ErrorState title={t("errorTitle")} description={t("errorDescription")} />
      ) : !digest ? (
        <EmptyState
          icon={<Newspaper aria-hidden="true" className="size-5" />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Link href={"/digest" as Route} className={buttonVariants({ size: "sm" })}>
              {t("viewArchive")}
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{digest.date}</Badge>
            <Badge variant="info">{tDigest(`slot.${digest.slot}`)}</Badge>
            <span className="text-xs text-muted-foreground">
              {tDigest("asOf", { time: formatDateTime(digest.created_at) })}
            </span>
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {digest.title.trim() || t("untitled")}
          </h3>
          {preview ? <Markdown content={preview} /> : null}
        </div>
      )}
    </Panel>
  );
}
