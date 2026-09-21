/**
 * `/symbol/[symbol]` grafik periyodu (Faz 3 / Birim 3.3, D-06).
 *
 * Periyot URL'de (`?period=`) tutulur; böylece paylaşılabilir ve geri/ileri
 * tuşlarıyla çalışır. Yalnız günlük mum (`1d`) kullanılır; aralık seçici yok
 * (tek istek, periyot değişiminde yeni istek).
 */
import type { Route } from "next";

/** Grafikte sunulan periyotlar; backend `/price/history` ve `/economy/history` ikisinde de geçerli. */
export const CHART_PERIODS = ["1mo", "3mo", "6mo", "1y", "2y", "5y"] as const;
export type ChartPeriod = (typeof CHART_PERIODS)[number];

export const DEFAULT_CHART_PERIOD: ChartPeriod = "1mo";

/** Tüm grafiklerde kullanılan mum aralığı. */
export const CHART_INTERVAL = "1d";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function isChartPeriod(value: unknown): value is ChartPeriod {
  return typeof value === "string" && (CHART_PERIODS as readonly string[]).includes(value);
}

/** `?period=` değerini doğrular; geçersiz/eksikse varsayılana düşer. */
export function parseChartPeriod(value: string | string[] | undefined): ChartPeriod {
  const raw = firstValue(value);
  return isChartPeriod(raw) ? raw : DEFAULT_CHART_PERIOD;
}

/**
 * Periyot bağlantısı üretir. `typedRoutes` dinamik query string'i statik olarak
 * ifade edemediğinden tek zorunlu cast; hedef `/symbol/<sembol>?period=` kalır.
 */
export function buildSymbolHref(symbol: string, period: ChartPeriod): Route {
  const params = new URLSearchParams();
  if (period !== DEFAULT_CHART_PERIOD) {
    params.set("period", period);
  }
  const suffix = params.toString();
  return (suffix.length > 0 ? `/symbol/${symbol}?${suffix}` : `/symbol/${symbol}`) as Route;
}
