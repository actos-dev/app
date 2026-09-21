"use client";

/**
 * Piyasa nabzı widget'ı (Faz 5B / Birim 5B.1, P-05, B-01, S-15).
 *
 * RSC'den gelen TEK `/economy/quotes?symbols=USD,EUR,XAU-GRAM` yanıtı
 * tohumlanır; böylece FX ve metal için ayrı istek yoktur (P-02). Piyasa
 * açıkken `usePollingInterval` ile tazelenir; kapalıyken aralık `false`.
 */
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { Delta } from "@/components/market/Delta";
import { PriceText } from "@/components/market/PriceText";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { useFormatters } from "@/lib/format";
import type { PulseSymbol } from "@/app/(app)/dashboard/dashboard-data";
import { qk } from "@/lib/query/keys";
import { usePollingInterval } from "@/lib/query/polling";
import type { EconomyQuote, EconomyQuoteBundle } from "@/types/market";

type PulseCard = {
  symbol: PulseSymbol;
  labelKey: "usd" | "eur" | "gold";
};

const PULSE_CARDS: readonly PulseCard[] = [
  { symbol: "USD", labelKey: "usd" },
  { symbol: "EUR", labelKey: "eur" },
  { symbol: "XAU-GRAM", labelKey: "gold" },
];

/** Quote'ta alış varsa onu, yoksa işlem fiyatını döner. */
function quotePrice(quote: EconomyQuote | undefined): number | null {
  return quote?.buying ?? quote?.price ?? null;
}

type MarketPulseWidgetProps = {
  initialData: EconomyQuoteBundle | null;
  className?: string;
};

export function MarketPulseWidget({ initialData, className }: MarketPulseWidgetProps) {
  const t = useTranslations("dashboard.pulse");
  const tMarkets = useTranslations("markets");
  const { formatDateTime } = useFormatters();
  const refetchInterval = usePollingInterval();
  const symbols = useMemo(() => PULSE_CARDS.map((card) => card.symbol), []);

  const query = useQuery({
    queryKey: qk.economyQuotes({ symbols }),
    queryFn: () =>
      apiFetch<EconomyQuoteBundle>("/api/v1/economy/quotes", {
        query: { symbols: symbols.join(",") },
      }),
    refetchInterval,
    ...(initialData ? { initialData } : {}),
  });

  const quotes = query.data?.quotes ?? {};
  const hasAny = PULSE_CARDS.some((card) => quotes[card.symbol] !== undefined);

  return (
    <Panel title={t("title")} className={className}>
      {query.isError && !hasAny ? (
        <ErrorState
          title={t("error")}
          retry={{ label: t("retry"), onRetry: () => void query.refetch() }}
        />
      ) : query.isPending && !query.data ? (
        <Skeleton className="h-24 w-full" />
      ) : !hasAny ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PULSE_CARDS.map((card) => {
              const quote = quotes[card.symbol];
              return (
                <div
                  key={card.symbol}
                  className="flex flex-col gap-1 rounded-md border border-border bg-surface-raised px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{t(card.labelKey)}</span>
                    {quote?.stale ? (
                      <Badge variant="warning">{tMarkets("stale")}</Badge>
                    ) : null}
                  </div>
                  <PriceText value={quotePrice(quote)} className="text-lg" />
                  <Delta value={quote?.change_pct ?? null} percent />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {tMarkets("updatedAt", { time: formatDateTime(query.data?.ts) })}
          </p>
        </div>
      )}
    </Panel>
  );
}
