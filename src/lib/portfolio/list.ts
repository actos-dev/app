/**
 * `/portfolio` sunucu veri yükleyicisi (Faz 4 / Birim 4.1, B-10).
 *
 * Öncelikli kaynak `GET /portfolios/summaries` (tek istek, değerleme dahil).
 * Backend deploy'u geride kaldığında bu uç 404/502 dönebilir; o durumda
 * `GET /portfolios` (ham liste) ile liste gösterilir, değerleme alanları
 * UI'da "—" olur ve sayfa çökmez.
 *
 * Ayrım `serverAuthApiFetchWithStatus` ile YAPILIR:
 *   - 2xx          → summaries (gövde bozuksa fallback'e düş),
 *   - 404 / 5xx / ağ (status 0) → fallback,
 *   - diğer 4xx (401/403/429)   → hata (gereksiz yeniden deneme yok).
 *
 * Fallback'te de portföy başına EK istek atılmaz (N+1 yok): ham liste tek
 * çağrıda tüm portföyleri döndürür.
 */
import { serverAuthApiFetch, serverAuthApiFetchWithStatus } from "@/lib/api/server-auth";

import { PORTFOLIOS_PATH, portfolioSummariesServerPath } from "./api-paths";
import type {
  Portfolio,
  PortfolioMetadata,
  PortfolioSummary,
  PortfolioSummaryResponse,
} from "./types";

/** `/portfolio` listesinin çözümlenmiş veri modu. */
export type PortfolioListData =
  | { mode: "summaries"; items: PortfolioSummary[] }
  | { mode: "fallback"; items: PortfolioMetadata[] }
  | { mode: "error" };

/** summaries uçunun "henüz yok" sayılan durumları. */
function shouldFallback(status: number): boolean {
  // 2xx: uç var ama gövde beklenen şekilde değilse yine ham listeye düş.
  if (status >= 200 && status < 300) {
    return true;
  }
  // 404 (uç yok) / 5xx (geçici arıza) / 0 (ağ kesintisi).
  return status === 0 || status === 404 || status >= 500;
}

/** `/portfolio` listesini summaries → fallback → hata sırasıyla çözer. */
export async function loadPortfolioList(): Promise<PortfolioListData> {
  const { status, data } = await serverAuthApiFetchWithStatus<PortfolioSummaryResponse>(
    portfolioSummariesServerPath(),
  );

  if (status >= 200 && status < 300 && data && Array.isArray(data.items)) {
    return { mode: "summaries", items: data.items };
  }

  if (!shouldFallback(status)) {
    return { mode: "error" };
  }

  const portfolios = await serverAuthApiFetch<Portfolio[]>(PORTFOLIOS_PATH);
  if (portfolios === null) {
    return { mode: "error" };
  }
  return { mode: "fallback", items: portfolios.map((portfolio) => portfolio.metadata) };
}
