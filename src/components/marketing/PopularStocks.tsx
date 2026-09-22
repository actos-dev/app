/**
 * Landing öne çıkan hisseler kartı (plan Faz 2 / Birim 2.3a, D-12).
 *
 * Sanal portföy mock'u yerine gerçek `/companies/summary` verisini gösterir;
 * satırlar sembol sayfasına, başlık ise tüm piyasalara bağlanır. Sunucu
 * bileşenidir: sayılar saf biçimlendiricilerle ve `tabular-nums` ile hizalanır,
 * veri gelmezse yalnız başlık ve bağlantıdan oluşan panel gösterilir.
 */
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { formatChangePercent, formatPrice } from "@/lib/format";
import type { CompanySummary } from "@/types/market";

export type PopularStocksProps = {
  rows: CompanySummary[];
  title: string;
  viewAllLabel: string;
  locale: Locale;
};

/** Değişim yüzdesine göre renk sınıfı; veri yoksa nötr. */
function changeTone(changePct: number | null): string {
  if (changePct === null) {
    return "text-muted-foreground";
  }
  return changePct >= 0 ? "text-positive" : "text-negative";
}

export function PopularStocks({ rows, title, viewAllLabel, locale }: PopularStocksProps) {
  return (
    <div className="rounded-lg border border-border bg-surface shadow-panel">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <Link href="/markets" className="text-sm text-primary hover:text-primary-hover">
          {viewAllLabel}
        </Link>
      </div>
      {rows.length > 0 ? (
        <ul className="flex flex-col border-t border-border">
          {rows.map((row) => (
            <li key={row.ticker}>
              <Link
                href={`/symbol/${row.ticker}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-raised"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-mono text-sm text-foreground">{row.ticker}</span>
                  <span className="truncate text-xs text-muted-foreground">{row.name}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-sm tabular-nums text-foreground">
                    {formatPrice(row.last_price, { locale })}
                  </span>
                  <span className={`font-mono text-xs tabular-nums ${changeTone(row.change_pct)}`}>
                    {formatChangePercent(row.change_pct, { locale })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
