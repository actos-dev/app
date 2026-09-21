/**
 * `/research/reports` sunucu veri yükleyicisi (Faz 5 / Birim 5A.1).
 *
 * `404` (rapor yok/erişim yok) ile `5xx`/ağ kesintisi ayrılır: yalnız gerçek
 * 404'te sayfa `notFound()` döner; diğer hatalarda zarif `ErrorState` çizilir.
 * `generateMetadata` ile sayfa aynı istekte tek kez yükler (`React.cache`).
 */
import { cache } from "react";

import { serverAuthApiFetchWithStatus } from "@/lib/api/server-auth";

import { reportServerPath } from "./api-paths";
import type { ReportDetail } from "./types";

/** `/research/reports/[id]` çözümlenmiş veri durumu. */
export type ReportDetailData =
  | { status: "ok"; report: ReportDetail }
  | { status: "not-found" }
  | { status: "error" };

/** Rapor kimliği pozitif tam sayı mı? (backend `report_id: int`) */
function isPositiveInteger(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) > 0;
}

/** Tek raporu sunucudan (çerez forward edilerek) yükler. */
export const loadReport = cache(async (id: string): Promise<ReportDetailData> => {
  if (!isPositiveInteger(id)) {
    return { status: "not-found" };
  }

  const { status, data } = await serverAuthApiFetchWithStatus<ReportDetail>(
    reportServerPath(id),
  );

  if (status === 404) {
    return { status: "not-found" };
  }
  if (!data) {
    return { status: "error" };
  }
  return { status: "ok", report: data };
});
