/**
 * Misafir paneli yükselen/düşen hisse listesi (Faz 5C / X-09).
 *
 * Sunucu bileşeni: veri RSC paketinden gelir, EK İSTEK AÇMAZ. Satırlar
 * `/symbol/{ticker}` sayfasına gider; fiyat/değişim paylaşılan `PriceText` ve
 * `Delta` ile (renk körü güvenli çift kodlama) gösterilir.
 */
import type { Route } from "next";
import Link from "next/link";

import { Delta } from "@/components/market/Delta";
import { PriceText } from "@/components/market/PriceText";
import { EmptyState } from "@/components/shared/EmptyState";
import { Panel } from "@/components/shared/Panel";
import type { CompanySummary } from "@/types/market";

type GuestMoversWidgetProps = {
  title: string;
  rows: CompanySummary[];
  emptyLabel: string;
  className?: string;
};

export function GuestMoversWidget({ title, rows, emptyLabel, className }: GuestMoversWidgetProps) {
  return (
    <Panel title={title} className={className}>
      {rows.length === 0 ? (
        <EmptyState title={emptyLabel} />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {rows.map((row) => (
            <li key={row.ticker}>
              <Link
                href={`/symbol/${row.ticker}` as Route}
                className="flex min-h-11 items-center justify-between gap-3 rounded-md px-1 text-sm text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover md:min-h-9"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-mono">{row.ticker}</span>
                  <span className="truncate text-xs text-muted-foreground">{row.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <PriceText value={row.last_price} />
                  <Delta value={row.change_pct} percent />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
