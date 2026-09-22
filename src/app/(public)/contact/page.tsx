/**
 * `/contact` (Faz 2 / Birim 2.3b).
 *
 * İçerik backend `GET /api/v1/contact` ucundan SSR ile gelir. Backend'de form
 * gönderim ucu YOKTUR; bu yüzden form değil yalnız bilgi ve e-posta bağlantısı
 * çizilir. GitHub adresi `href`'e yazılmadan önce `safeExternalUrl` süzgecinden
 * geçer (yalnız http/https). Her kanal tek bir bağlantıdır; kartın tamamı
 * tıklanabilir.
 */
import { ExternalLink, Mail } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/EmptyState";
import { GitHubMark } from "@/components/shared/GitHubMark";
import { PageHeader } from "@/components/shared/PageHeader";
import { serverApiFetch } from "@/lib/api/server";
import { parseContactResponse, type ContactResponse } from "@/lib/public-content";
import { safeExternalUrl } from "@/lib/safe-url";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public");
  return {
    title: t("contact.title"),
    description: t("contact.description"),
    alternates: { canonical: "/contact" },
  };
}

const CHANNEL_CLASS =
  "flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-colors duration-150 ease-out hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

const ICON_TILE_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-raised text-primary";

export default async function ContactPage() {
  const t = await getTranslations("public");
  const response = await serverApiFetch<ContactResponse>("/api/v1/contact", {
    revalidate: 3600,
  });
  const contact = parseContactResponse(response);
  const email = contact?.email ?? null;
  const githubUrl = safeExternalUrl(contact?.github);
  const githubLabel = githubUrl ? githubUrl.replace(/^https?:\/\//, "") : null;
  const hasChannel = email !== null || githubUrl !== null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 md:px-6 md:py-16">
      <PageHeader title={t("contact.title")} />
      {hasChannel ? (
        <ul className="flex flex-col gap-3">
          {email ? (
            <li>
              <a href={`mailto:${email}`} className={CHANNEL_CLASS}>
                <span className={ICON_TILE_CLASS}>
                  <Mail aria-hidden="true" className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {t("contact.emailTitle")}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">{email}</span>
                </span>
              </a>
            </li>
          ) : null}
          {githubUrl && githubLabel ? (
            <li>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={CHANNEL_CLASS}
              >
                <span className={ICON_TILE_CLASS}>
                  <GitHubMark className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {t("contact.githubTitle")}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">{githubLabel}</span>
                </span>
                <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </a>
            </li>
          ) : null}
        </ul>
      ) : (
        <EmptyState title={t("contact.emptyTitle")} description={t("contact.emptyDescription")} />
      )}
    </div>
  );
}
