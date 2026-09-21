/**
 * `/markets` iskeleti (Faz 1 / Birim 1.4).
 *
 * Auth koruması henüz yok; Faz 2'de middleware ile korunacak. Hisse/döviz/
 * metal/halka arz sekmeleri Faz 3'te gelecek.
 */
import { Construction } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("markets") };
}

export default async function MarketsPage() {
  const t = await getTranslations();

  return (
    <>
      <PageHeader title={t("nav.markets")} />
      <EmptyState
        icon={<Construction aria-hidden="true" className="size-5" />}
        title={t("common.comingSoonTitle")}
        description={t("common.comingSoonDescription")}
      />
    </>
  );
}
