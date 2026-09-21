/**
 * `/research/reports/[id]` — rapor detayı (Faz 5 / Birim 5A.1, S-03, K-09).
 *
 * Sunucu bileşeni: rapor çerez forward edilerek yüklenir; gerçek 404'te
 * `notFound()`, diğer hatalarda `ErrorState`. Markdown sanitize edilmiş olarak
 * render edilir (`ReportMarkdown`); ham HTML yolu yoktur.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ReportDetailView } from "@/components/reports/ReportDetailView";
import { ErrorState } from "@/components/shared/ErrorState";
import { loadReport } from "@/lib/reports/detail";

export async function generateMetadata({
  params,
}: PageProps<"/research/reports/[id]">): Promise<Metadata> {
  const { id } = await params;
  const data = await loadReport(id);
  const t = await getTranslations("reports");
  return { title: data.status === "ok" ? data.report.title || t("detail.titleFallback") : t("title") };
}

export default async function ReportDetailPage({ params }: PageProps<"/research/reports/[id]">) {
  const { id } = await params;
  const data = await loadReport(id);

  if (data.status === "not-found") {
    notFound();
  }

  if (data.status === "error") {
    const t = await getTranslations("reports");
    return (
      <ErrorState title={t("detail.errorTitle")} description={t("detail.errorDescription")} />
    );
  }

  return <ReportDetailView report={data.report} />;
}
