/**
 * `/portfolio/[id]` portföy çalışma alanı (Faz 4 / Birim 4.2, B-07, B-10, S-15).
 *
 * Sunucu bileşeni: detay + değerleme + işlemler + özet PARALEL çekilir ve
 * piyasa durumuyla birlikte istemci adasına `initialData` olarak geçirilir.
 * Portföy yoksa (404) gerçek `notFound()`; diğer hatalarda sayfa çökmez,
 * `ErrorState` gösterilir.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PortfolioDetail } from "@/components/portfolio/PortfolioDetail";
import { ErrorState } from "@/components/shared/ErrorState";
import { serverAuthApiFetch } from "@/lib/api/server-auth";
import { loadPortfolioDetail } from "@/lib/portfolio/detail";
import type { MarketStatus } from "@/types/market";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("portfolio") };
}

export default async function PortfolioDetailPage({ params }: PageProps<"/portfolio/[id]">) {
  const { id } = await params;
  const [detail, status, t] = await Promise.all([
    loadPortfolioDetail(id),
    serverAuthApiFetch<MarketStatus>("/api/v1/market/status"),
    getTranslations("portfolio"),
  ]);

  if (detail.status === "not-found") {
    notFound();
  }

  if (detail.status === "error") {
    return (
      <ErrorState title={t("detail.error.title")} description={t("detail.error.description")} />
    );
  }

  return (
    <PortfolioDetail
      portfolio={detail.portfolio}
      valuation={detail.valuation}
      transactions={detail.transactions}
      summary={detail.summary}
      summaries={detail.summaries}
      {...(status ? { marketStatus: status } : {})}
    />
  );
}
