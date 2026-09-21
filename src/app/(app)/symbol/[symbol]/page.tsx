/**
 * `/symbol/[symbol]` (Faz 2 / Birim 2.3a stub, plan §4).
 *
 * Tek enstrüman detayı (BIST/FX/metal ortak) Faz 3'te gelecek; şimdilik başlık
 * ticker parametresidir. Rota `(app)` grubunda olduğu için layout oturum
 * doğrulamasını yapar.
 */
import { Construction } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export async function generateMetadata({
  params,
}: PageProps<"/symbol/[symbol]">): Promise<Metadata> {
  const { symbol } = await params;
  return { title: symbol };
}

export default async function SymbolPage({ params }: PageProps<"/symbol/[symbol]">) {
  const [{ symbol }, t] = await Promise.all([params, getTranslations("common")]);

  return (
    <>
      <PageHeader title={symbol} description={t("comingSoonDescription")} />
      <EmptyState
        icon={<Construction aria-hidden="true" className="size-5" />}
        title={t("comingSoonTitle")}
        description={t("comingSoonDescription")}
      />
    </>
  );
}
