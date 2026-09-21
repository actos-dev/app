/**
 * `/kitchen-sink` iskeleti (Faz 1 / Birim 1.4).
 *
 * Bileşen kataloğu Birim 1.5'te dolacak; şimdilik yalnız iskelet. Geliştirme
 * ortamında sidebar'da görünür (`devOnly`), üretimde gizlenir.
 */
import { Construction } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("kitchenSink") };
}

export default async function KitchenSinkPage() {
  const t = await getTranslations();

  return (
    <>
      <PageHeader title={t("nav.kitchenSink")} />
      <EmptyState
        icon={<Construction aria-hidden="true" className="size-5" />}
        title={t("common.comingSoonTitle")}
        description={t("common.comingSoonDescription")}
      />
    </>
  );
}
