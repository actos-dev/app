/**
 * `/profile` iskeleti (Faz 1 / Birim 1.4).
 *
 * Auth koruması henüz yok; Faz 2'de middleware ile korunacak. Hesap, görünüm,
 * botlar ve indirmeler sekmeleri Faz 5B'de gelecek.
 */
import { Construction } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("profile") };
}

export default async function ProfilePage() {
  const t = await getTranslations();

  return (
    <>
      <PageHeader title={t("nav.profile")} />
      <EmptyState
        icon={<Construction aria-hidden="true" className="size-5" />}
        title={t("common.comingSoonTitle")}
        description={t("common.comingSoonDescription")}
      />
    </>
  );
}
