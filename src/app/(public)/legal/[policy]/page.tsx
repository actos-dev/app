/**
 * `/legal/[policy]` (Faz 2 / Birim 2.3a stub).
 *
 * Bilinen politikalar allowlist ile eşlenir (keyfi anahtar erişimi yok);
 * içerik backend `GET /api/v1/legal?policy=&lang=` ile Birim 2.3b'de gelecek.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ComingSoonSection } from "@/components/marketing/ComingSoonSection";

const POLICY_LABEL_KEYS = {
  terms: "policies.terms",
  privacy_policy: "policies.privacyPolicy",
  cookie_policy: "policies.cookiePolicy",
  disclaimer: "policies.disclaimer",
} as const;

type PolicySlug = keyof typeof POLICY_LABEL_KEYS;

function isPolicySlug(value: string): value is PolicySlug {
  return value in POLICY_LABEL_KEYS;
}

export async function generateMetadata({
  params,
}: PageProps<"/legal/[policy]">): Promise<Metadata> {
  const [t, { policy }] = await Promise.all([getTranslations("public"), params]);
  if (!isPolicySlug(policy)) {
    return { title: t("policies.unknown") };
  }
  return { title: t(POLICY_LABEL_KEYS[policy]) };
}

export default async function LegalPage({ params }: PageProps<"/legal/[policy]">) {
  const [t, { policy }] = await Promise.all([getTranslations("public"), params]);
  if (!isPolicySlug(policy)) {
    notFound();
  }

  return <ComingSoonSection title={t(POLICY_LABEL_KEYS[policy])} description={t("legalDescription")} />;
}
