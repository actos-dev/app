"use client";

/**
 * Portföy değeri alan grafiği (Faz 4 / Birim 4.3, D-06, P-12).
 *
 * `lightweight-charts` **client-only**'dır; `HistoryTab` içinde
 * `next/dynamic({ ssr: false })` ile ve yalnız "Geçmiş" sekmesi açıldığında
 * yüklenir (ilk HTML/chunk'a girmez). Veri zaten sekme sorgusundan gelir;
 * bu bileşen ağ çağrısı YAPMAZ, yalnız çizer.
 *
 * Renkler tema token'larından okunur; `data-theme` değişimi MutationObserver
 * ile yakalanır. Unmount'ta `chart.remove()` ile dispose edilir; boyut
 * ResizeObserver ile takip edilir ve reduced-motion'da kinetik kaydırma kapanır.
 */
import {
  AreaSeries,
  createChart,
  type AreaData,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  buildChartOptions,
  readChartTokens,
  withAlpha,
  type ChartTokens,
} from "@/lib/charts/theme";
import {
  ANALYTICS_PERIODS,
  type AnalyticsPeriod,
} from "@/lib/portfolio/periods";
import type { PortfolioHistoryPoint } from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";

type PortfolioValueChartProps = {
  points: PortfolioHistoryPoint[];
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  className?: string;
};

type NormalizedPoint = { time: UTCTimestamp; value: number };

function toTimestamp(ts: string): UTCTimestamp | null {
  const millis = Date.parse(ts);
  return Number.isFinite(millis) ? ((millis / 1000) as UTCTimestamp) : null;
}

/** Geçersiz noktaları atar, zamanı artan sıraya dizer ve tekilleştirir. */
function normalizePoints(points: PortfolioHistoryPoint[]): NormalizedPoint[] {
  const byTime = new Map<number, NormalizedPoint>();
  for (const point of points) {
    const time = toTimestamp(point.ts);
    const value = point.total_value;
    if (time === null || !Number.isFinite(value)) {
      continue;
    }
    byTime.set(time, { time, value });
  }
  return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
}

export function PortfolioValueChart({
  points,
  period,
  onPeriodChange,
  className,
}: PortfolioValueChartProps) {
  const t = useTranslations("portfolio.analytics");
  const tPeriod = useTranslations("portfolio.analytics.period");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [tokens, setTokens] = useState<ChartTokens>(() => readChartTokens());

  const data = useMemo(() => normalizePoints(points), [points]);
  // Dönem başından sona yön; alan rengini belirler (çift kodlama: başlıkta da yazar).
  const rising = data.length > 1 ? data[data.length - 1]!.value >= data[0]!.value : true;

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

  useEffect(() => {
    chartRef.current?.applyOptions(buildChartOptions(tokens));
  }, [tokens]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || data.length === 0) {
      return;
    }
    const color = rising ? tokens.up : tokens.down;
    const series = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor: withAlpha(color, 0.28),
      bottomColor: withAlpha(color, 0),
      lineWidth: 2,
      priceLineVisible: false,
    });
    const seriesData: AreaData<UTCTimestamp>[] = data.map((point) => ({
      time: point.time,
      value: point.value,
    }));
    series.setData(seriesData);
    chart.timeScale().fitContent();

    return () => {
      // Grafik zaten dispose edildiyse (unmount sırası) seriyi kaldırma.
      if (chartRef.current === chart) {
        chart.removeSeries(series);
      }
    };
  }, [data, rising, tokens]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-1" role="group" aria-label={t("periodLabel")}>
        {ANALYTICS_PERIODS.map((value) => (
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

      <div className="relative h-72 overflow-hidden rounded-lg border border-border bg-surface md:h-80">
        <div
          ref={containerRef}
          role="img"
          aria-label={t("history.ariaLabel", {
            period: tPeriod(period),
            count: data.length,
          })}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
