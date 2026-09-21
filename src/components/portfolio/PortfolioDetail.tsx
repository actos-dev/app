"use client";

/**
 * Portföy çalışma alanı (Faz 4 / Birim 4.2, U-04, U-05, S-15, K-03).
 *
 * RSC verisiyle tohumlanan üç sorgu (detay, değerleme, işlemler) + özet sorgusu
 * istemcide CANLI kalır; her yazma `qk.portfolios()` kökünü tazelediğinden
 * başlık, pozisyonlar ve işlem geçmişi birlikte güncellenir. İlk boyamada ek
 * istek atılmaz (initialData taze sayılır).
 *
 * Analiz/istatistik sekmeleri bilinçli olarak 4.3'e bırakıldı; bu birimde
 * yalnız temel değerleme alanları gösterilir, sahte UI yoktur.
 */
import { ArrowDownUp, Copy, Download, Pencil, Trash2 } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";

import { Delta } from "@/components/market/Delta";
import { PriceText } from "@/components/market/PriceText";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/Panel";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  useDuplicatePortfolio,
  usePortfolio,
  usePortfolioSummaries,
  usePortfolioTransactions,
  usePortfolioValuation,
} from "@/hooks/usePortfolios";
import { portfolioExportCsvPath } from "@/lib/portfolio/api-paths";
import type {
  Portfolio,
  PortfolioSummary,
  PortfolioTransaction,
  PortfolioValuation,
  TradeType,
} from "@/lib/portfolio/types";
import { useFormatters } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MarketStatus } from "@/types/market";

import { PortfolioDeleteDialog } from "./PortfolioDeleteDialog";
import { PortfolioRenameDialog } from "./PortfolioRenameDialog";
import { PositionsTable } from "./PositionsTable";
import { TradeDialog } from "./TradeDialog";
import { TransactionHistory } from "./TransactionHistory";

type PortfolioDetailProps = {
  portfolio: Portfolio;
  valuation: PortfolioValuation | null;
  transactions: PortfolioTransaction[];
  summary: PortfolioSummary | null;
  summaries: PortfolioSummary[];
  marketStatus?: MarketStatus;
};

/** Başlık altındaki tek istatistik hücresi. */
function Stat({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-surface p-3">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

type TradeState = {
  open: boolean;
  ticker?: string;
  type: TradeType;
};

export function PortfolioDetail({
  portfolio,
  valuation,
  transactions,
  summary,
  summaries,
  marketStatus,
}: PortfolioDetailProps) {
  const t = useTranslations("portfolio");
  const router = useRouter();
  const { formatDateTime } = useFormatters();

  const detailQuery = usePortfolio(portfolio.metadata.id, portfolio);
  const valuationQuery = usePortfolioValuation(portfolio.metadata.id, valuation);
  const transactionsQuery = usePortfolioTransactions(portfolio.metadata.id, transactions);
  const summariesQuery = usePortfolioSummaries({ initialData: { items: summaries } });
  const duplicate = useDuplicatePortfolio();

  const [renameOpen, setRenameOpen] = useState(false);
  const [trade, setTrade] = useState<TradeState>({ open: false, type: "BUY" });

  const id = portfolio.metadata.id;
  const name = detailQuery.data?.metadata.name ?? portfolio.metadata.name;
  const currentValuation = valuationQuery.data ?? valuation;
  const currentTransactions = transactionsQuery.data ?? transactions;
  const currentSummary =
    summariesQuery.data?.items.find((item) => item.id === id) ?? summary;

  const holdings = useMemo(() => {
    const map: Record<string, number> = {};
    for (const asset of currentValuation?.assets ?? []) {
      map[asset.ticker.toUpperCase()] = asset.amount;
    }
    return map;
  }, [currentValuation]);

  const currentValue = currentValuation?.total_value ?? currentSummary?.current_value ?? null;
  const costBasis = currentSummary?.cost_basis ?? portfolio.metadata.initial_balance;
  const cash = currentValuation?.cash_balance ?? portfolio.metadata.balance;
  const positionCount =
    currentValuation?.assets.length ?? currentSummary?.position_count ?? 0;
  const asOf = currentSummary?.as_of ?? null;

  const openTrade = (ticker?: string, type: TradeType = "BUY") =>
    setTrade({ open: true, ...(ticker ? { ticker } : {}), type });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={name}
        backHref="/portfolio"
        backLabel={t("detail.back")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => openTrade()}>
              <ArrowDownUp aria-hidden="true" className="size-4" />
              {t("detail.actions.trade")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={t("detail.actions.rename")}
              onClick={() => setRenameOpen(true)}
            >
              <Pencil aria-hidden="true" className="size-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={t("detail.actions.duplicate")}
              disabled={duplicate.isPending}
              onClick={() => duplicate.mutate({ id, name })}
            >
              <Copy aria-hidden="true" className="size-4" />
            </Button>
            <a
              href={portfolioExportCsvPath(id)}
              download={`portfolio-${id}.csv`}
              aria-label={t("detail.actions.export")}
              className={cn(buttonVariants({ variant: "secondary", size: "icon" }))}
            >
              <Download aria-hidden="true" className="size-4" />
            </a>
            <PortfolioDeleteDialog
              id={id}
              name={name}
              onDeleted={() => router.push("/portfolio" as Route)}
              trigger={
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label={t("detail.actions.delete")}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              }
            />
          </div>
        }
      />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={t("card.currentValue")}>
          <PriceText value={currentValue} />
        </Stat>
        <Stat label={t("detail.stats.cost")}>
          <PriceText value={costBasis} />
        </Stat>
        <Stat label={t("card.totalReturn")}>
          <span className="flex flex-col items-start">
            <Delta value={currentSummary?.total_return_pct ?? currentValuation?.pnl_percentage} percent />
            {currentValuation ? (
              <Delta value={currentValuation.total_pnl} className="text-xs" />
            ) : null}
          </span>
        </Stat>
        <Stat label={t("card.dailyChange")}>
          <Delta value={currentSummary?.daily_change_pct} percent />
        </Stat>
        <Stat label={t("detail.stats.cash")}>
          <PriceText value={cash} />
        </Stat>
        <Stat label={t("detail.stats.positions")}>
          <span className="font-mono tabular-nums">{positionCount}</span>
        </Stat>
      </dl>

      <p role="status" className="text-xs text-muted-foreground">
        {asOf ? t("card.asOf", { time: formatDateTime(asOf) }) : t("card.asOfUnavailable")}
      </p>

      <Panel title={t("detail.positions.title")}>
        {currentValuation ? (
          <PositionsTable
            assets={currentValuation.assets}
            holdingsValue={currentValuation.holdings_value}
            onTrade={(ticker) => openTrade(ticker)}
          />
        ) : (
          <p role="alert" className="text-sm text-muted-foreground">
            {t("detail.valuationUnavailable")}
          </p>
        )}
      </Panel>

      <TransactionHistory portfolioId={id} transactions={currentTransactions} />

      <TradeDialog
        key={`${trade.ticker ?? "none"}-${trade.type}`}
        portfolioId={id}
        {...(trade.ticker ? { initialTicker: trade.ticker } : {})}
        initialType={trade.type}
        open={trade.open}
        onOpenChange={(next) => setTrade((state) => ({ ...state, open: next }))}
        {...(marketStatus ? { marketStatus } : {})}
        holdings={holdings}
        cashBalance={cash}
      />

      <PortfolioRenameDialog
        portfolioId={id}
        currentName={name}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
    </div>
  );
}
