/**
 * `/portfolio/[id]` sunucu veri yükleyicisi (Faz 4 / Birim 4.2, B-07, B-10, S-15).
 *
 * Dört uç PARALEL çekilir; portföy başına sabit sayıda istek vardır ve pozisyon
 * sayısından bağımsızdır (N+1 yok):
 *   - `GET /portfolios/{id}`             → metadata + işlemler,
 *   - `GET /portfolios/{id}/valuation`   → nakit + pozisyon değerlemesi,
 *   - `GET /portfolios/{id}/transactions`→ işlem geçmişi,
 *   - `GET /portfolios/summaries`        → günlük değişim + `as_of` tazeliği
 *     (değerleme yanıtı bu iki alanı içermez; liste ucu B-10 ile geldi).
 *
 * `404` (portföy yok) ile `5xx`/ağ ayrılır: yalnız portföy kaydı 404 ise
 * sayfa `notFound()` döner; değerleme/işlem geçmişi gelmezse sayfa kısmi
 * durumla çizilir, çökmez.
 */
import { serverAuthApiFetchWithStatus } from "@/lib/api/server-auth";

import {
  portfolioServerPath,
  portfolioSummariesServerPath,
  portfolioTransactionsServerPath,
  portfolioValuationServerPath,
} from "./api-paths";
import type {
  Portfolio,
  PortfolioSummary,
  PortfolioSummaryResponse,
  PortfolioTransaction,
  PortfolioValuation,
} from "./types";

/** `/portfolio/[id]` çözümlenmiş veri durumu. */
export type PortfolioDetailData =
  | {
      status: "ok";
      portfolio: Portfolio;
      /** Değerleme alınamadıysa `null`; UI pozisyon yerine uyarı gösterir. */
      valuation: PortfolioValuation | null;
      transactions: PortfolioTransaction[];
      /** Günlük değişim/`as_of` için özet kaydı; bulunamazsa `null`. */
      summary: PortfolioSummary | null;
      /**
       * Tüm portföy özetleri; başlık sorgusunu tohumlar ve yazma sonrası
       * `summaries` tazelemesinin aktif kalmasını sağlar.
       */
      summaries: PortfolioSummary[];
    }
  | { status: "not-found" }
  | { status: "error" };

/** `/portfolio/[id]` verisini paralel çözer. */
export async function loadPortfolioDetail(id: string): Promise<PortfolioDetailData> {
  const [portfolio, valuation, transactions, summaries] = await Promise.all([
    serverAuthApiFetchWithStatus<Portfolio>(portfolioServerPath(id)),
    serverAuthApiFetchWithStatus<PortfolioValuation>(portfolioValuationServerPath(id)),
    serverAuthApiFetchWithStatus<PortfolioTransaction[]>(portfolioTransactionsServerPath(id)),
    serverAuthApiFetchWithStatus<PortfolioSummaryResponse>(portfolioSummariesServerPath()),
  ]);

  // Kaynak yok: gerçek 404 (diğer uçlar da 404 dönmüş olabilir, önemsiz).
  if (portfolio.status === 404) {
    return { status: "not-found" };
  }
  // Ağ/5xx ya da bozuk gövde: sayfa seviyesinde hata durumu.
  if (!portfolio.data) {
    return { status: "error" };
  }

  const summaryItems = summaries.data?.items ?? [];
  const summary = summaryItems.find((item) => item.id === id) ?? null;

  return {
    status: "ok",
    portfolio: portfolio.data,
    valuation: valuation.data ?? null,
    transactions: Array.isArray(transactions.data) ? transactions.data : [],
    summary,
    summaries: summaryItems,
  };
}
