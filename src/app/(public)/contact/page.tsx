/**
 * `/contact` (Faz 2 / Birim 2.3a stub).
 *
 * Gerçek içerik backend `GET /api/v1/contact` ile Birim 2.3b'de gelecek.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ComingSoonSection } from "@/components/marketing/ComingSoonSection";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public");
  return { title: t("contact.title"), description: t("contact.description") };
}

export default async function ContactPage() {
  const t = await getTranslations("public");

  return <ComingSoonSection title={t("contact.title")} description={t("contact.description")} />;
}
