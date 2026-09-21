/**
 * Landing ürün mock'u (plan §3.1, D-05).
 *
 * Raster görsel kullanılmaz: mini portföy tablosu ve CSS/SVG çizgi grafiği
 * yalnızca tasarım token'larıyla kurulur. Metinler i18n'den prop olarak gelir;
 * sayılar temsilîdir ve `tabular-nums` ile hizalanır.
 */
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export type ProductMockProps = {
  portfolioLabel: string;
  totalLabel: string;
  dailyLabel: string;
  positionsLabel: string;
  disclaimer: string;
};

type MockPosition = {
  ticker: string;
  name: string;
  price: string;
  change: string;
  direction: "up" | "down";
};

const POSITIONS: readonly MockPosition[] = [
  { ticker: "THYAO", name: "Türk Hava Yolları", price: "312,40", change: "1,84%", direction: "up" },
  { ticker: "ASELS", name: "Aselsan", price: "78,95", change: "0,62%", direction: "up" },
  { ticker: "GARAN", name: "Garanti BBVA", price: "142,10", change: "-0,48%", direction: "down" },
];

export function ProductMock({
  portfolioLabel,
  totalLabel,
  dailyLabel,
  positionsLabel,
  disclaimer,
}: ProductMockProps) {
  return (
    <div className="rounded-lg border border-border bg-surface shadow-panel">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{portfolioLabel}</span>
          <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
            128.450,75
            <span className="ml-1 text-base text-muted-foreground">₺</span>
          </span>
          <span className="text-xs text-muted-foreground">{totalLabel}</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-positive px-2 py-1 text-xs font-medium text-positive-foreground">
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
          <span className="tabular-nums">{dailyLabel} +2,41%</span>
        </span>
      </div>

      <div className="px-4 pt-4">
        <svg
          viewBox="0 0 320 72"
          role="img"
          aria-label={`${portfolioLabel} ${dailyLabel}`}
          className="h-16 w-full text-primary"
          preserveAspectRatio="none"
        >
          <polyline
            points="0,58 28,52 56,55 84,44 112,47 140,36 168,39 196,28 224,31 252,20 280,22 320,12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">{positionsLabel}</p>
        <ul className="flex flex-col gap-2">
          {POSITIONS.map((position) => (
            <li key={position.ticker} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 flex-col">
                <span className="font-mono text-sm text-foreground">{position.ticker}</span>
                <span className="truncate text-xs text-muted-foreground">{position.name}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm tabular-nums text-foreground">{position.price}</span>
                <span
                  className={`inline-flex items-center gap-0.5 font-mono text-xs tabular-nums ${
                    position.direction === "up" ? "text-positive" : "text-negative"
                  }`}
                >
                  {position.direction === "up" ? (
                    <ArrowUpRight aria-hidden="true" className="size-3" />
                  ) : (
                    <ArrowDownRight aria-hidden="true" className="size-3" />
                  )}
                  {position.change}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">{disclaimer}</p>
    </div>
  );
}
