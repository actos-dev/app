"use client";

/**
 * Portföy özeti widget'ı (Faz 5B / Birim 5B.1, P-05, U-13).
 *
 * RSC'den gelen `summaries` yanıtı `initialData` ile tohumlanır; böylece ilk
 * boyamada ek istek olmaz. Piyasa açıkken `usePollingInterval` ile tazelenir,
 * kapalıyken aralık `false` olduğundan hiç istek atılmaz (P-04).
 *
 * Sorgu anahtarı (`qk.portfolioSummaries()`) mevcut `usePortfolioSummaries`
 * kancasıyla AYNIDIR; portföy yazmaları tüm tüketicileri birlikte tazeler (P-03).
 * Toplam değer ve günlük değişim istemcide toplanır (portföy başına istek yok).
 */
import { useQuery } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { Delta } from "@/components/market/Delta";
import { PriceText } from "@/components/market/PriceText";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { portfolioSummariesPath } from "@/lib/portfolio/api-paths";
import type { PortfolioSummaryResponse } from "@/lib/portfolio/types";
import { qk } from "@/lib/query/keys";
import { usePollingInterval } from "@/lib/query/polling";

/** Widget'ta gösterilen azami portföy satırı; kalanı "Tümü" bağlantısında. */
const MAX_ROWS = 4;

type PortfolioSummaryWidgetProps = {
  initialData: PortfolioSummaryResponse | null;
  className?: string;
};

type PortfolioTotals = {
  value: number | null;
  changePct: number | null;
};

/** Özet satırlarından toplam değer ve ağırlıklı günlük değişim yüzdesi. */
function aggregate(items: PortfolioSummaryResponse["items"]): PortfolioTotals {
  let value = 0;
  let previous = 0;
  let known = false;

  for (const item of items) {
    const current = item.current_value ?? item.cost_basis;
    if (current === null) {
      continue;
    }
    known = true;
    value += current;
    if (item.daily_change_pct !== null && Number.isFinite(item.daily_change_pct)) {
      previous += current / (1 + item.daily_change_pct / 100);
    } else {
      previous += current;
    }
  }

  if (!known) {
    return { value: null, changePct: null };
  }
  const changePct = previous > 0 ? ((value - previous) / previous) * 100 : null;
  return { value, changePct };
}

export function PortfolioSummaryWidget({ initialData, className }: PortfolioSummaryWidgetProps) {
  const t = useTranslations("dashboard.portfolio");
  const refetchInterval = usePollingInterval();

  const query = useQuery({
    queryKey: qk.portfolioSummaries(),
    queryFn: () => apiFetch<PortfolioSummaryResponse>(portfolioSummariesPath()),
    refetchInterval,
    ...(initialData ? { initialData } : {}),
  });

  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const totals = useMemo(() => aggregate(items), [items]);
  const currency = items[0]?.currency ?? "TRY";

  return (
    <Panel
      title={t("title")}
      className={className}
      actions={
        <Link
          href={"/portfolio" as Route}
          className="text-xs text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
        >
          {t("viewAll")}
        </Link>
      }
    >
      {query.isError && items.length === 0 ? (
        <ErrorState
          title={t("error")}
          retry={{ label: t("retry"), onRetry: () => void query.refetch() }}
        />
      ) : query.isPending && items.length === 0 ? (
        <Skeleton className="h-28 w-full" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Briefcase aria-hidden="true" className="size-5" />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Link href={"/portfolio" as Route} className={buttonVariants({ size: "sm" })}>
              {t("emptyCta")}
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{t("totalValue")}</span>
              <span className="text-2xl font-semibold text-foreground">
                <PriceText value={totals.value} suffix={currency} />
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs text-muted-foreground">{t("dailyChange")}</span>
              <Delta value={totals.changePct} percent className="text-sm" />
            </div>
            <span className="text-xs text-muted-foreground">
              {t("count", { count: items.length })}
            </span>
          </div>

          <ul className="flex flex-col divide-y divide-border">
            {items.slice(0, MAX_ROWS).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/portfolio/${item.id}` as Route}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-md px-1 text-sm text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover md:min-h-9"
                >
                  <span className="min-w-0 truncate">{item.name}</span>
                  <span className="flex shrink-0 items-center gap-3">
                    <PriceText value={item.current_value ?? item.cost_basis} suffix={item.currency} />
                    <Delta value={item.daily_change_pct} percent />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
