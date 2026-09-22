/**
 * `/downloads` (Faz 2 / Birim 2.3b).
 *
 * Masaüstü istemci DONDURULDU (WEB_REFACTOR_PLAN §0); sayfa bunu açıkça
 * belirtir. `public/downloads/manifest.json` varsa platformlara göre gruplanmış
 * sürüm/dosya listesi çizilir; yok veya erişilemezse hata fırlatılmaz, sade bir
 * "sürüm yok" durumu gösterilir. Raster görsel kullanılmaz.
 */
import { Info, PackageOpen } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  downloadFileType,
  groupDownloads,
  readDownloadsManifest,
} from "@/lib/downloads";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public");
  return {
    title: t("downloads.title"),
    description: t("downloads.description"),
    alternates: { canonical: "/downloads" },
  };
}

export default async function DownloadsPage() {
  const t = await getTranslations("public");
  const manifest = await readDownloadsManifest();
  const groups = manifest ? groupDownloads(manifest.files) : [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <PageHeader title={t("downloads.title")} />

      <p className="mb-8 flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>{t("downloads.frozenNote")}</span>
      </p>

      {manifest && groups.length > 0 ? (
        <div className="flex flex-col gap-6">
          <p className="font-mono text-sm tabular-nums text-foreground">
            {t("downloads.version", { version: manifest.version })}
          </p>
          {groups.map((group) => (
            <section
              key={group.platform}
              className="overflow-hidden rounded-lg border border-border bg-surface"
            >
              <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
                {t(`downloads.platforms.${group.platform}`)}
              </h2>
              <ul className="flex flex-col divide-y divide-border">
                {group.files.map((file) => (
                  <li key={file}>
                    <a
                      href={`/downloads/${encodeURIComponent(file)}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover"
                    >
                      <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
                        {file}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {t(`downloads.fileTypes.${downloadFileType(file)}`)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<PackageOpen aria-hidden="true" className="size-5" />}
          title={t("downloads.emptyTitle")}
          description={t("downloads.emptyDescription")}
        />
      )}
    </div>
  );
}
