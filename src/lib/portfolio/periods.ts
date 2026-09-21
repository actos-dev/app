/**
 * Portföy analizi periyotları (Faz 4 / Birim 4.3).
 *
 * Backend `period` deseni tüm analiz uçlarında aynıdır:
 * `^(1w|1mo|3mo|6mo|1y|max)$`. Uç başına varsayılan farklıdır:
 * `history`/`returns` → `1mo`, `risk` → `1y`; bu yüzden iki sabit tutulur.
 */
export const ANALYTICS_PERIODS = ["1w", "1mo", "3mo", "6mo", "1y", "max"] as const;

export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

/** `history`/`returns` uçlarının backend varsayılanı. */
export const DEFAULT_ANALYTICS_PERIOD: AnalyticsPeriod = "1mo";

/** `risk` ucunun backend varsayılanı. */
export const DEFAULT_RISK_PERIOD: AnalyticsPeriod = "1y";

export function isAnalyticsPeriod(value: unknown): value is AnalyticsPeriod {
  return typeof value === "string" && (ANALYTICS_PERIODS as readonly string[]).includes(value);
}
