/**
 * Public "yakında" bölümü (Faz 2 / Birim 2.3a geçici stub'ı).
 *
 * Hakkında, iletişim, indir ve yasal sayfaları 2.3b'de gerçek içerikle
 * doldurulana kadar tek bir başlık + boş durum gösterir.
 */
import { Construction } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export async function ComingSoonSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const t = await getTranslations("common");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<Construction aria-hidden="true" className="size-5" />}
        title={t("comingSoonTitle")}
        description={t("comingSoonDescription")}
      />
    </div>
  );
}
