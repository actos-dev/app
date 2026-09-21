/**
 * Danışman yardımcıları (Faz 5 / Birim 5A.2).
 *
 * Framework'süz saf fonksiyonlar: hem sunucu hem istemci bileşenlerinde
 * kullanılabilir. Görünen metin üretmez; yalnız eşleme/doğrulama kararlarını
 * verir.
 *
 * Vektör sırası backend'de sabittir: `VECTOR_KEYS = ["risk", "horizon",
 * "profitability"]` (`src/analysis/stock_vector.py`).
 */
import {
  ADVISOR_HORIZONS,
  ADVISOR_PROFITABILITY,
  ADVISOR_RISK_TOLERANCE,
  type AdvisorFitResult,
  type AdvisorHorizon,
  type AdvisorProfitability,
  type AdvisorRiskTolerance,
} from "./types";

/** Backend `FitRequest.limit` sınırı (1-100). */
export const ADVISOR_MIN_LIMIT = 1;
export const ADVISOR_MAX_LIMIT = 100;

/** Varsayılan sonuç sayısı; backend varsayılanı 5. */
export const ADVISOR_DEFAULT_LIMIT = 5;

/** Portföy profili için ticker sayısı sınırı (backend 1-50). */
export const ADVISOR_MAX_PORTFOLIO_TICKERS = 50;

export function isAdvisorHorizon(value: string): value is AdvisorHorizon {
  return (ADVISOR_HORIZONS as readonly string[]).includes(value);
}

export function isAdvisorProfitability(value: string): value is AdvisorProfitability {
  return (ADVISOR_PROFITABILITY as readonly string[]).includes(value);
}

export function isAdvisorRiskTolerance(value: string): value is AdvisorRiskTolerance {
  return (ADVISOR_RISK_TOLERANCE as readonly string[]).includes(value);
}

/** Ticker normalleştirir (büyük harf, kırpılmış). */
export function normalizeAdvisorTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

/** Vektör eleman indeksleri (backend sırası). */
export const VECTOR_INDEX = {
  risk: 0,
  horizon: 1,
  profitability: 2,
} as const;

/** Vektör değerini `0..1` aralığına kırpar; geçersizse `null`. */
export function vectorValue(
  vector: readonly number[] | null | undefined,
  index: number,
): number | null {
  if (!vector) {
    return null;
  }
  const value = vector[index];
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(value, 0), 1)
    : null;
}

/**
 * Skoru yüzdeye çevirir (`score = 1 / (1 + distance)`, `0..1`).
 * Geçersizse `null`.
 */
export function scorePercent(score: number | null | undefined): number | null {
  return typeof score === "number" && Number.isFinite(score)
    ? Math.round(Math.min(Math.max(score, 0), 1) * 100)
    : null;
}

/**
 * Bir bar/gösterge için tonal sınıf.
 *
 * Eşikler görsel amaçlıdır; karar mercii değildir ve tek başına renge
 * bırakılmaz (metin/işaret eşlik eder).
 */
export type BarTone = "positive" | "neutral" | "negative";

export function barTone(value: number | null): BarTone {
  if (value === null) {
    return "neutral";
  }
  if (value >= 0.7) {
    return "positive";
  }
  if (value < 0.4) {
    return "negative";
  }
  return "neutral";
}

/** Öneri satırından vade/hedef/risk etiket anahtarlarını çıkarır. */
export function advisorResultHref(ticker: string): `/symbol/${string}` {
  return `/symbol/${normalizeAdvisorTicker(ticker)}`;
}

/**
 * İki farklı uç aynı `{ticker, vector, score, distance}` şeklini döner; bu
 * yardımcı liste sıralamasını (skora göre azalan) istemci tarafında garanti
 * eder. Backend zaten sıralı döner; zarif savunma amaçlıdır.
 */
export function sortAdvisorResults(results: readonly AdvisorFitResult[]): AdvisorFitResult[] {
  return [...results].sort((a, b) => b.score - a.score);
}