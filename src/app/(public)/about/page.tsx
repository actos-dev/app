/**
 * `/about` (Faz 2 / Birim 2.3b).
 *
 * İçerik backend `GET /api/v1/about?lang=` ucundan SSR ile gelir; düz metin
 * boş satır sınırlarından paragraflara bölünür. Uç erişilemezse veya gövde
 * bozuksa sayfa hata fırlatmaz, sade bir boş durum gösterir.
 */
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { serverApiFetch } from "@/lib/api/server";
import { parseAboutResponse, type AboutResponse } from "@/lib/public-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public");
  return {
    title: t("about.title"),
    description: t("about.description"),
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const [t, locale] = await Promise.all([getTranslations("public"), getLocale()]);
  const response = await serverApiFetch<AboutResponse>("/api/v1/about", {
    query: { lang: locale },
    revalidate: 3600,
  });
  const about = parseAboutResponse(response);
  const paragraphs = about?.paragraphs ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <PageHeader title={t("about.title")} description={t("about.description")} />
      {paragraphs.length > 0 ? (
        <div className="flex flex-col gap-4">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <EmptyState title={t("about.emptyTitle")} description={t("about.emptyDescription")} />
      )}
    </div>
  );
}
