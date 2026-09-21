/**
 * `/about` (Faz 2 / Birim 2.3a stub).
 *
 * Gerçek içerik backend `GET /api/v1/about` ile Birim 2.3b'de gelecek; şimdilik
 * route ve metadata hazır edilir.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ComingSoonSection } from "@/components/marketing/ComingSoonSection";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public");
  return { title: t("about.title"), description: t("about.description") };
}

export default async function AboutPage() {
  const t = await getTranslations("public");

  return <ComingSoonSection title={t("about.title")} description={t("about.description")} />;
}
