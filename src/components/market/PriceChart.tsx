"use client";

/**
 * Fiyat grafiği (Faz 3 / Birim 3.3, D-06, P-12).
 *
 * lightweight-charts **client-only**'dır; bu modül `SymbolDetail` içinde
 * `next/dynamic({ ssr: false })` ile yüklenir, ilk HTML'e girmez. Veri
 * `/price/history` (BIST) veya `/economy/history` (economy) ucundan React
 * Query ile çekilir; periyot değişince yeni istek atılır (tek istek/istek).
 *
 * Renkler tema token'larından okunur (`--chart-up|--chart-down|--chart-grid|
 * --chart-text`); `data-theme` değişimini MutationObserver yakalar ve grafik
 * yeniden kurulmadan yeniden renklendirilir. Unmount'ta `remove()` ile
 * dispose edilir; boyut ResizeObserver ile takip edilir.
 */
import { useQuery } from "@tanstack/react-query";
import {
  AreaSeries,
  CandlestickSeries,
  createChart,
  type AreaData,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import {
  buildChartOptions,
  readChartTokens,
  withAlpha,
  type ChartTokens,
} from "@/lib/charts/theme";
import { economyHistoryPath, priceHistoryPath } from "@/lib/markets/api-paths";
import { CHART_INTERVAL, CHART_PERIODS, type ChartPeriod } from "@/lib/markets/periods";
import { qk } from "@/lib/query/keys";
import { cn } from "@/lib/utils";
import type { EconomyCandle, PriceCandle } from "@/types/market";

export type ChartView = "area" | "candles";

type HistoryCandle = PriceCandle | EconomyCandle;

type PriceChartProps = {
  /** Kanonik sembol (BIST ticker veya economy registry anahtarı). */
  symbol: string;
  kind: "bist" | "economy";
  period: ChartPeriod;
  onPeriodChange: (period: ChartPeriod) => void;
  className?: string;
};

type NormalizedCandle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
};

function toTimestamp(ts: string): UTCTimestamp | null {
  const millis = Date.parse(ts);
  return Number.isFinite(millis) ? ((millis / 1000) as UTCTimestamp) : null;
}

/** Geçersiz mumları atar, zamanı artan sıraya dizer ve tekilleştirir. */
function normalizeCandles(candles: HistoryCandle[] | undefined): NormalizedCandle[] {
  if (!candles) {
    return [];
  }
  const byTime = new Map<number, NormalizedCandle>();
  for (const candle of candles) {
    const time = toTimestamp(candle.ts);
    const { open, high, low, close } = candle;
    if (
      time === null ||
      open === null ||
      high === null ||
      low === null ||
      close === null ||
      ![open, high, low, close].every((value) => Number.isFinite(value))
    ) {
      continue;
    }
    byTime.set(time, { time, open, high, low, close });
  }
  return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
}

export function PriceChart({ symbol, kind, period, onPeriodChange, className }: PriceChartProps) {
  const t = useTranslations("symbol.chart");
  const tPeriod = useTranslations("symbol.period");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [tokens, setTokens] = useState<ChartTokens>(() => readChartTokens());
  const [view, setView] = useState<ChartView>("area");

  const query = useQuery({
    queryKey:
      kind === "bist"
        ? qk.priceHistory(symbol, period, CHART_INTERVAL)
        : qk.economyHistory(symbol, period),
    queryFn: () =>
      apiFetch<HistoryCandle[]>(
        kind === "bist" ? priceHistoryPath(symbol) : economyHistoryPath(symbol),
        { query: { period, interval: CHART_INTERVAL } },
      ),
  });

  const candles = useMemo(() => normalizeCandles(query.data), [query.data]);

  // Grafik örneğini bir kez kur; boyut ve tema değişimini gözle.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const chart = createChart(container, buildChartOptions(readChartTokens()));
    chartRef.current = chart;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          chart.resize(width, height);
        }
      });
      resizeObserver.observe(container);
    }

    const themeObserver = new MutationObserver(() => {
      setTokens(readChartTokens());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      resizeObserver?.disconnect();
      themeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Tema değişince grafik düzeyi seçenekleri (zemin, ızgara, eksenler) tazele;
  // seri renkleri aşağıdaki seri effect'inde güncellenir.
  useEffect(() => {
    chartRef.current?.applyOptions(buildChartOptions(tokens));
  }, [tokens]);

  // Görünüm veya tema değişince seriyi yeniden kur; unmount'ta seriyi kaldır.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length === 0) {
      return;
    }

    let series: ISeriesApi<"Area"> | ISeriesApi<"Candlestick">;
    if (view === "candles") {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: tokens.up,
        downColor: tokens.down,
        borderUpColor: tokens.up,
        borderDownColor: tokens.down,
        wickUpColor: tokens.up,
        wickDownColor: tokens.down,
        priceLineVisible: false,
      });
      const data: CandlestickData<UTCTimestamp>[] = candles.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));
      candleSeries.setData(data);
      series = candleSeries;
    } else {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: tokens.up,
        topColor: withAlpha(tokens.up, 0.28),
        bottomColor: withAlpha(tokens.up, 0),
        lineWidth: 2,
        priceLineVisible: false,
      });
      const data: AreaData<UTCTimestamp>[] = candles.map((candle) => ({
        time: candle.time,
        value: candle.close,
      }));
      areaSeries.setData(data);
      series = areaSeries;
    }

    chart.timeScale().fitContent();
    return () => {
      // Grafik zaten dispose edildiyse (unmount sırası) seriyi kaldırma.
      if (chartRef.current === chart) {
        chart.removeSeries(series);
      }
    };
  }, [candles, tokens, view]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1" role="group" aria-label={t("periodLabel")}>
          {CHART_PERIODS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={value === period ? "secondary" : "ghost"}
              aria-pressed={value === period}
              onClick={() => onPeriodChange(value)}
            >
              {tPeriod(value)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1" role="group" aria-label={t("viewLabel")}>
          <Button
            type="button"
            size="sm"
            variant={view === "area" ? "secondary" : "ghost"}
            aria-pressed={view === "area"}
            onClick={() => setView("area")}
          >
            {t("area")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "candles" ? "secondary" : "ghost"}
            aria-pressed={view === "candles"}
            onClick={() => setView("candles")}
          >
            {t("candles")}
          </Button>
        </div>
      </div>

      <div className="relative h-80 overflow-hidden rounded-lg border border-border bg-surface md:h-96">
        {/* Grafik konteynerine `role="img"` VERİLMEZ: içinde TradingView
            attribution bağlantısı (odaklanabilir) barındırır ve bu
            `nested-interactive` ihlali yaratır. Açıklama ayrı bir sr-only
            metinle verilir. */}
        <span className="sr-only">{t("ariaLabel", { symbol, period: tPeriod(period) })}</span>
        <div ref={containerRef} className="h-full w-full" />
        {query.isLoading ? (
          <div className="absolute inset-0 flex flex-col gap-2 bg-surface p-4">
            <Skeleton className="h-full w-full" />
            <span className="sr-only" role="status">
              {t("loading")}
            </span>
          </div>
        ) : null}
        {query.isError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface p-4">
            <ErrorState
              title={t("error")}
              retry={{ label: t("retry"), onRetry: () => void query.refetch() }}
            />
          </div>
        ) : null}
        {!query.isLoading && !query.isError && candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface p-4">
            <EmptyState title={t("empty")} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
