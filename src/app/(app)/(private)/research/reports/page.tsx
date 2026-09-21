/**
 * `/research/reports` — rapor üretimi + geçmiş (Faz 5 / Birim 5A.1).
 *
 * Sunucu bileşeni: rapor tipleri/maliyet (`/reports/info`), geçmiş ve kredi
 * bakiyesi PARALEL çekilir (çerez forward edilerek) ve istemci adasına
 * `initialData` olarak geçirilir; böylece ilk boyamada çift istek olmaz.
 *
 * Üretim SENKRONdur (B-09 job altyapısı yok); iptal/gerçek ilerleme sunulmaz,
 * bu karar `ReportWizard` başında belgelenmiştir.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ReportsWorkspace } from "@/components/reports/ReportsWorkspace";
import { serverAuthApiFetch } from "@/lib/api/server-auth";
import {
  creditsServerPath,
  reportsHistoryServerPath,
  reportsInfoServerPath,
} from "@/lib/reports/api-paths";
import type { CreditsResponse, ReportHistoryItem, ReportInfo } from "@/lib/reports/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("reports") };
}

export default async function ReportsPage() {
  const [info, history, credits] = await Promise.all([
    serverAuthApiFetch<ReportInfo>(reportsInfoServerPath()),
    serverAuthApiFetch<ReportHistoryItem[]>(reportsHistoryServerPath()),
    serverAuthApiFetch<CreditsResponse>(creditsServerPath()),
  ]);

  return (
    <ReportsWorkspace
      {...(info ? { initialInfo: info } : {})}
      {...(Array.isArray(history) ? { initialHistory: history } : {})}
      {...(credits ? { initialCredits: credits } : {})}
    />
  );
}
