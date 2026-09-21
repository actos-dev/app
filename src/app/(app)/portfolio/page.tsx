/**
 * `/portfolio` liste sayfası (Faz 4 / Birim 4.1, B-10, P-02).
 *
 * Sunucu bileşeni: portföy listesi (özet → fallback) ve `market/status`
 * PARALEL çekilir; veri istemci bileşenine `initialData` olarak geçirilir,
 * böylece ilk boyamada ek istek olmaz. Portföy detayı ve al/sat akışı
 * 4.2/4.3 birimlerindedir.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MarketStatusPill } from "@/components/market/MarketStatusPill";
import { PortfolioCreateDialog } from "@/components/portfolio/PortfolioCreateDialog";
import { PortfolioList } from "@/components/portfolio/PortfolioList";
import { PageHeader } from "@/components/shared/PageHeader";
import { serverAuthApiFetch } from "@/lib/api/server-auth";
import { loadPortfolioList } from "@/lib/portfolio/list";
import type { MarketStatus } from "@/types/market";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("portfolio") };
}

export default async function PortfolioPage() {
  const [listData, status, t] = await Promise.all([
    loadPortfolioList(),
    serverAuthApiFetch<MarketStatus>("/api/v1/market/status"),
    getTranslations("portfolio"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex items-center gap-2">
            <MarketStatusPill initialData={status ?? undefined} />
            <PortfolioCreateDialog />
          </div>
        }
      />

      <PortfolioList data={listData} />
    </div>
  );
}
