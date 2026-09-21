/**
 * `/downloads` (Faz 2 / Birim 2.3a stub).
 *
 * Masaüstü/mobil indirme bağlantıları Birim 2.3b'de eklenecek.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ComingSoonSection } from "@/components/marketing/ComingSoonSection";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public");
  return { title: t("downloads.title"), description: t("downloads.description") };
}

export default async function DownloadsPage() {
  const t = await getTranslations("public");

  return <ComingSoonSection title={t("downloads.title")} description={t("downloads.description")} />;
}
