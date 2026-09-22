/**
 * `/legal/[policy]` (Faz 2 / Birim 2.3b).
 *
 * Geçerli policy anahtarları backend `src/api/legal.py::POLICIES` ile senkron
 * allowlist'tir (`@/lib/public-content`); bilinmeyen slug `notFound()` ile
 * gerçek 404 döner, keyfi anahtar backend'e taşınmaz. İçerik `GET /api/v1/legal`
 * ucundan SSR ile gelir ve boş satır/madde bloklarına ayrılarak okunur
 * tipografiyle çizilir.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { defaultLocale, isLocale } from "@/i18n/config";
import { serverApiFetch } from "@/lib/api/server";
import { formatDate } from "@/lib/format";
import {
  isLegalPolicy,
  parseLegalResponse,
  type LegalPolicy,
  type LegalResponse,
  LEGAL_POLICIES,
} from "@/lib/public-content";

const POLICY_LABEL_KEYS = {
  terms: "policies.terms",
  privacy_policy: "policies.privacyPolicy",
  cookie_policy: "policies.cookiePolicy",
  disclaimer: "policies.disclaimer",
} as const satisfies Record<LegalPolicy, string>;

export function generateStaticParams() {
  return LEGAL_POLICIES.map((policy) => ({ policy }));
}

export async function generateMetadata({
  params,
}: PageProps<"/legal/[policy]">): Promise<Metadata> {
  const [t, { policy }] = await Promise.all([getTranslations("public"), params]);
  if (!isLegalPolicy(policy)) {
    notFound();
  }
  return {
    title: t(POLICY_LABEL_KEYS[policy]),
    alternates: { canonical: `/legal/${policy}` },
  };
}

export default async function LegalPage({ params }: PageProps<"/legal/[policy]">) {
  const [t, locale, { policy }] = await Promise.all([
    getTranslations("public"),
    getLocale(),
    params,
  ]);
  if (!isLegalPolicy(policy)) {
    notFound();
  }

  const response = await serverApiFetch<LegalResponse>("/api/v1/legal", {
    query: { policy, lang: locale },
    revalidate: 3600,
  });
  const legal = parseLegalResponse(response);
  const blocks = legal?.blocks ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <PageHeader
        title={t(POLICY_LABEL_KEYS[policy])}
        description={
          legal?.lastUpdated
            ? t("legal.lastUpdated", {
                date: formatDate(legal.lastUpdated, {
                  locale: isLocale(locale) ? locale : defaultLocale,
                }),
              })
            : undefined
        }
      />
      {blocks.length > 0 ? (
        <div className="flex flex-col gap-4">
          {blocks.map((block, index) =>
            block.type === "list" ? (
              <ul
                key={`list-${index}`}
                className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-muted-foreground"
              >
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p
                key={`paragraph-${index}`}
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {block.text}
              </p>
            ),
          )}
        </div>
      ) : (
        <EmptyState title={t("legal.emptyTitle")} description={t("legal.emptyDescription")} />
      )}
    </div>
  );
}
