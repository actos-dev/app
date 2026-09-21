"use client";

/**
 * "Dağılım" analiz sekmesi (Faz 4 / Birim 4.3).
 *
 * Yeni grafik kütüphanesi yok: token renkli yatay bar listesi çizilir. Görsel
 * katman ekran okuyuculardan `aria-hidden` ile gizlenir; aynı veri `sr-only`
 * bir tabloyla erişilebilir alternatif olarak sunulur (`aria-label` başlıklı).
 */
import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolioDiversification } from "@/hooks/usePortfolios";
import { useFormatters } from "@/lib/format";
import type {
  PortfolioAssetClass,
  PortfolioDiversificationAsset,
} from "@/lib/portfolio/types";

import { AnalyticsEmpty, AnalyticsError } from "./parts";

/** Varlık sınıfı başına token rengi; keyfi renk yok. */
const TYPE_COLORS: Record<PortfolioAssetClass, string> = {
  stock: "var(--primary)",
  forex: "var(--info)",
  metal: "var(--warning)",
};

const CASH_COLOR = "var(--accent)";
const POSITION_COLOR = "var(--primary)";

type BarRow = {
  key: string;
  label: string;
  value: number;
  percent: number;
  color: string;
};

/** Yüzdeyi 0–100 aralığına sıkıştırır. */
function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function Bars({ rows, label }: { rows: BarRow[]; label: string }) {
  const { formatPrice } = useFormatters();
  return (
    <div aria-hidden="true">
      <ul aria-label={label} className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-sm text-foreground">{row.label}</span>
            <span className="relative h-2 min-w-8 flex-1 overflow-hidden rounded-full bg-surface-raised">
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${clampPercent(row.percent)}%`, backgroundColor: row.color }}
              />
            </span>
            <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
              {formatPrice(row.percent, { fractionDigits: 1 })}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Görsel barların erişilebilir alternatifi; başlık `caption`'dan gelir. */
function AccessibleTable({ rows, label }: { rows: BarRow[]; label: string }) {
  const t = useTranslations("portfolio.analytics.diversification");
  const { formatPrice } = useFormatters();
  return (
    <table className="sr-only" aria-label={label}>
      <caption>{label}</caption>
      <thead>
        <tr>
          <th scope="col">{t("name")}</th>
          <th scope="col">{t("value")}</th>
          <th scope="col">{t("weight")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <td>{row.label}</td>
            <td>{formatPrice(row.value)}</td>
            <td>{formatPrice(row.percent, { fractionDigits: 1 })}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function positionLabel(asset: PortfolioDiversificationAsset): string {
  return asset.ticker;
}

type DiversificationTabProps = { portfolioId: string };

export function DiversificationTab({ portfolioId }: DiversificationTabProps) {
  const t = useTranslations("portfolio.analytics.diversification");
  const query = usePortfolioDiversification(portfolioId);
  const data = query.data;

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (query.isError || !data) {
    return <AnalyticsError onRetry={() => void query.refetch()} />;
  }

  const total = data.total_value;
  const hasPositions = data.assets.length > 0;
  const cashValue = data.cash_balance ?? (hasPositions ? 0 : total);
  const cashPct =
    data.cash_allocation_pct ?? (total > 0 ? (cashValue / total) * 100 : 0);

  const typeRows: BarRow[] = (Object.keys(TYPE_COLORS) as PortfolioAssetClass[])
    .map((assetClass) => {
      const value = data.allocation_by_type?.[assetClass] ?? 0;
      return {
        key: `type-${assetClass}`,
        label: t(`types.${assetClass}`),
        value,
        percent: total > 0 ? (value / total) * 100 : 0,
        color: TYPE_COLORS[assetClass],
      };
    })
    .filter((row) => row.value > 0);

  if (cashValue > 0) {
    typeRows.push({
      key: "cash",
      label: t("cash"),
      value: cashValue,
      percent: cashPct,
      color: CASH_COLOR,
    });
  }

  const positionRows: BarRow[] = data.assets
    .filter((asset) => asset.value !== null && asset.value > 0)
    .map((asset) => ({
      key: `asset-${asset.ticker}`,
      label: positionLabel(asset),
      value: asset.value ?? 0,
      percent: asset.allocation_pct,
      color: POSITION_COLOR,
    }))
    .sort((a, b) => b.percent - a.percent);

  if (typeRows.length === 0 && positionRows.length === 0) {
    return <AnalyticsEmpty title={t("empty")} description={t("emptyHint")} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {typeRows.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">{t("byType")}</h3>
          <Bars rows={typeRows} label={t("byType")} />
          <AccessibleTable rows={typeRows} label={t("typeTableLabel")} />
        </section>
      ) : null}

      {positionRows.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">{t("byPosition")}</h3>
          <Bars rows={positionRows} label={t("byPosition")} />
          <AccessibleTable rows={positionRows} label={t("positionTableLabel")} />
        </section>
      ) : null}
    </div>
  );
}
