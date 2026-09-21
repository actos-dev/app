"use client";

/**
 * Bülten içeriği görünümü (Faz 5 / Birim 5A.3, U-08, S-03).
 *
 * İçerik ve bölüm gövdeleri AI üretimi Markdown'dır; paylaşılan `Markdown`
 * bileşeniyle sanitize edilerek render edilir (ham HTML yolu yok). Başlık
 * `h3`, bölüm başlıkları `h4`: sayfa h1'i `PageHeader`'dan, panel h2'si
 * `Panel`'den gelir (A-04 hiyerarşisi).
 */
import { useTranslations } from "next-intl";

import { Markdown } from "@/components/shared/Markdown";
import { Badge } from "@/components/ui/badge";
import type { Digest } from "@/lib/digest/types";
import { useFormatters } from "@/lib/format";
import { cn } from "@/lib/utils";

type DigestViewerProps = {
  digest: Digest;
  className?: string;
};

export function DigestViewer({ digest, className }: DigestViewerProps) {
  const t = useTranslations("digest");
  const { formatDateTime } = useFormatters();

  const title = digest.title.trim();

  return (
    <article className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral">{digest.date}</Badge>
        <Badge variant="info">{t(`slot.${digest.slot}`)}</Badge>
        <span className="text-xs text-muted-foreground">
          {t("asOf", { time: formatDateTime(digest.created_at) })}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-foreground">{title || t("untitled")}</h3>

      {digest.content.trim() ? <Markdown content={digest.content} /> : null}

      {digest.sections.length > 0 ? (
        <div className="flex flex-col gap-4">
          {digest.sections.map((section, index) => (
            <section key={`${section.heading}-${index}`} className="flex flex-col gap-1.5">
              <h4 className="text-base font-semibold text-foreground">{section.heading}</h4>
              {section.body.trim() ? <Markdown content={section.body} /> : null}
            </section>
          ))}
        </div>
      ) : null}
    </article>
  );
}
