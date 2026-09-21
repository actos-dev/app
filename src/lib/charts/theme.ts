/**
 * lightweight-charts tema yardımcıları (Faz 4 / Birim 4.3, D-02, D-06).
 *
 * Grafik bileşenleri renkleri doğrudan yazmaz; `globals.css` token'larından
 * okur. Böylece 3 tema × açık/koyu tek kaynaktan yönetilir. `PriceChart` ve
 * `PortfolioValueChart` bu modülü paylaşır.
 */
import { ColorType, LineStyle, type ChartOptions, type DeepPartial } from "lightweight-charts";

export type ChartTokens = {
  up: string;
  down: string;
  grid: string;
  text: string;
  background: string;
};

/** Token okunamazsa (SSR/jsdom) koyu tema varsayılanları. */
export const FALLBACK_TOKENS: ChartTokens = {
  up: "#34d399",
  down: "#f87171",
  grid: "#232b3d",
  text: "#9aa7bd",
  background: "#0b0e14",
};

/** `document` kökünden grafik token'larını okur. */
export function readChartTokens(): ChartTokens {
  if (typeof document === "undefined") {
    return FALLBACK_TOKENS;
  }
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string): string =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    up: read("--chart-up", FALLBACK_TOKENS.up),
    down: read("--chart-down", FALLBACK_TOKENS.down),
    grid: read("--chart-grid", FALLBACK_TOKENS.grid),
    text: read("--chart-text", FALLBACK_TOKENS.text),
    background: read("--background", FALLBACK_TOKENS.background),
  };
}

/** `#rrggbb` token rengine alfa ekler; tanınmayan biçimde rengi aynen döner. */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.replace("#", "").trim();
  if (hex.length === 6 || hex.length === 8) {
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].every((channel) => Number.isFinite(channel))) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return color;
}

/** Azaltılmış hareket tercihi; jsdom'da `false`. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Tema token'larından grafik düzeyi seçenekleri. */
export function buildChartOptions(tokens: ChartTokens): DeepPartial<ChartOptions> {
  const reduceMotion = prefersReducedMotion();
  return {
    autoSize: false,
    layout: {
      background: { type: ColorType.Solid, color: tokens.background },
      textColor: tokens.text,
      fontFamily: "var(--font-geist-mono), monospace",
    },
    grid: {
      vertLines: { color: tokens.grid, style: LineStyle.Solid },
      horzLines: { color: tokens.grid, style: LineStyle.Solid },
    },
    rightPriceScale: { borderColor: tokens.grid },
    timeScale: { borderColor: tokens.grid, timeVisible: false, secondsVisible: false },
    // reduced-motion tercihinde kinetik kaydırma kapatılır (hareket minimumu).
    kineticScroll: { touch: !reduceMotion, mouse: !reduceMotion },
  };
}
