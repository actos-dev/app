"use client";

/**
 * Al/sat diyaloğu (Faz 4 / Birim 4.2, U-04, U-05, P-02, A-01, A-03).
 *
 * Akış:
 *   1. Yön (ALIŞ/SATIŞ) segmented kontrolle seçilir.
 *   2. Sembol `SymbolSearch` ile aranır; seçim sayfaya yönlendirmez.
 *   3. Seçili sembol için TEK fiyat isteği atılır (`useTradePrice`); satır/liste
 *      başına istek YOKTUR.
 *   4. Adet girilince komisyon ve toplam canlı hesaplanır (`computeTradeTotals`):
 *      ALIŞ'ta komisyon eklenir, SATIŞ'ta düşülür.
 *
 * SEANS KAPISI (U-04): `/market/status` kapalıysa gönderim BAŞTAN engellenir ve
 * gerekçe (tatil adı / sonraki açılış saati) görünür. Backend yine de
 * `error_market_closed` dönerse aynı i18n mesajı gösterilir.
 *
 * Doğrulama: sembol zorunlu, adet > 0; ALIŞ'ta nakit, SATIŞ'ta elde tutulan
 * adet ön kontrolü yapılır ve net hata metni gösterilir.
 */
import { ArrowDownUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent, type ReactElement } from "react";

import { PriceText } from "@/components/market/PriceText";
import { SymbolSearch } from "@/components/market/SymbolSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAddTransaction } from "@/hooks/usePortfolios";
import { useTradePrice } from "@/hooks/useTradePrice";
import { ApiError } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";
import { useFormatters } from "@/lib/format";
import { getCommissionRate, computeTradeTotals } from "@/lib/portfolio/trade";
import type { TradeType } from "@/lib/portfolio/types";
import { useMarketStatus } from "@/lib/query/polling";
import { cn } from "@/lib/utils";
import type { MarketStatus } from "@/types/market";

type TradeDialogProps = {
  portfolioId: string;
  /** Pozisyon satırından açılırsa varsayılan sembol. */
  initialTicker?: string;
  initialType?: TradeType;
  /** RSC'den gelen piyasa durumu; diyalog açılışında ek `/market/status` isteği olmaz. */
  marketStatus?: MarketStatus;
  /** SATIŞ ön kontrolü: elde tutulan adet haritası (sembol → adet). */
  holdings?: Record<string, number>;
  /** ALIŞ ön kontrolü: kullanılabilir nakit. */
  cashBalance?: number | null;
  /** Tetikleyici; kontrollü (`open`) kullanımda opsiyoneldir. */
  trigger?: ReactElement;
  /** Kontrollü açık durumu (portföy detayından programatik açılış). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** Türkçe klavye alışkanlığı: ondalık virgül de kabul edilir. */
function parseQuantity(value: string): number {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function TradeDialog({
  portfolioId,
  initialTicker,
  initialType = "BUY",
  marketStatus,
  holdings,
  cashBalance,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: TradeDialogProps) {
  const t = useTranslations("portfolio");
  const tErrors = useTranslations();
  const { formatPrice, formatDateTime } = useFormatters();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [type, setType] = useState<TradeType>(initialType);
  const [ticker, setTicker] = useState(initialTicker ?? "");
  const [quantity, setQuantity] = useState("");

  const { data: status } = useMarketStatus(marketStatus ? { initialData: marketStatus } : {});
  const marketOpen = status?.open ?? true;
  const { price, asOf, stale, isLoading: priceLoading, isError: priceError } = useTradePrice(
    ticker.length > 0 ? ticker : null,
  );
  const add = useAddTransaction(portfolioId);

  const rate = getCommissionRate();
  const parsedQuantity = parseQuantity(quantity);
  const totals = computeTradeTotals(price, parsedQuantity, type, rate);

  const owned = ticker.length > 0 ? (holdings?.[ticker.toUpperCase()] ?? 0) : 0;
  const insufficientBalance =
    type === "BUY" && totals !== null && cashBalance != null && totals.total > cashBalance;
  const insufficientQuantity = type === "SELL" && parsedQuantity > owned;

  const symbolError = ticker.length === 0 ? t("trade.validation.symbolRequired") : null;
  const quantityError =
    quantity.trim().length > 0 && (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0)
      ? t("trade.validation.quantityInvalid")
      : quantity.trim().length === 0
        ? t("trade.validation.quantityRequired")
        : null;

  const marketGate = !marketOpen
    ? status?.holiday_name
      ? t("trade.marketHoliday", { name: status.holiday_name })
      : status?.next_open_at
        ? t("trade.marketOpensAt", { time: formatDateTime(status.next_open_at) })
        : t("trade.marketClosed")
    : null;

  const canSubmit =
    marketOpen &&
    price !== null &&
    ticker.length > 0 &&
    Number.isFinite(parsedQuantity) &&
    parsedQuantity > 0 &&
    !insufficientBalance &&
    !insufficientQuantity &&
    !add.isPending;

  const serverError = add.isError
    ? tErrors(
        translateBackendError(add.error instanceof ApiError ? add.error.code : undefined),
      )
    : null;

  const reset = () => {
    setQuantity("");
    add.reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (onOpenChange) {
      onOpenChange(next);
    } else {
      setInternalOpen(next);
    }
    if (!next) {
      reset();
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    add.mutate(
      { ticker: ticker.toUpperCase(), type, quantity: parsedQuantity },
      {
        onSuccess: () => {
          reset();
          handleOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={type === "BUY" ? t("trade.buyTitle") : t("trade.sellTitle")}
      description={t("trade.description")}
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <div
          role="group"
          aria-label={t("trade.typeLabel")}
          className="grid grid-cols-2 gap-1 rounded-md border border-border bg-surface p-1"
        >
          {(["BUY", "SELL"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={type === option}
              onClick={() => setType(option)}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-1.5 rounded-sm text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring md:h-8",
                type === option
                  ? option === "BUY"
                    ? "bg-primary text-primary-foreground"
                    : "bg-negative text-negative-foreground"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
              )}
            >
              <ArrowDownUp aria-hidden="true" className="size-3.5" />
              {option === "BUY" ? t("trade.buy") : t("trade.sell")}
            </button>
          ))}
        </div>

        <FormField label={t("trade.symbol")} error={symbolError}>
          {(control) => (
            <SymbolSearch
              id={control.id}
              aria-label={t("trade.symbol")}
              placeholder={t("trade.symbolPlaceholder")}
              {...(control["aria-describedby"]
                ? { "aria-describedby": control["aria-describedby"] }
                : {})}
              {...(control["aria-invalid"] ? { "aria-invalid": control["aria-invalid"] } : {})}
              onSelect={(nextTicker) => {
                setTicker(nextTicker);
                setQuantity("");
                add.reset();
              }}
            />
          )}
        </FormField>

        {ticker.length > 0 ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-raised px-3 py-2">
            <span className="text-xs text-muted-foreground">{t("trade.unitPrice")}</span>
            <span className="flex items-center gap-2">
              {stale ? <Badge variant="warning">{t("trade.stalePrice")}</Badge> : null}
              {priceLoading ? (
                <span className="text-sm text-muted-foreground">{t("trade.priceLoading")}</span>
              ) : price !== null ? (
                <PriceText value={price} suffix="₺" />
              ) : (
                <span className="text-sm text-negative">{t("trade.priceUnavailable")}</span>
              )}
            </span>
          </div>
        ) : null}

        {priceError && ticker.length > 0 ? (
          <p role="alert" className="text-xs text-negative">
            {t("trade.priceUnavailable")}
          </p>
        ) : null}

        <FormField
          label={t("trade.quantity")}
          hint={
            type === "SELL"
              ? t("trade.ownedHint", { quantity: owned })
              : cashBalance != null
                ? t("trade.cashHint", { amount: formatPrice(cashBalance) })
                : undefined
          }
          error={
            quantityError ??
            (insufficientQuantity
              ? t("trade.validation.insufficientQuantity", { quantity: owned })
              : null) ??
            (insufficientBalance && totals
              ? t("trade.validation.insufficientBalance", {
                  amount: formatPrice(totals.total),
                })
              : null)
          }
        >
          {(control) => (
            <Input
              {...control}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="0"
            />
          )}
        </FormField>

        {totals !== null ? (
          <dl className="flex flex-col gap-1.5 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t("trade.subtotal")}</dt>
              <dd className="font-mono tabular-nums">{formatPrice(totals.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">
                {t("trade.commission", { rate: (rate * 100).toFixed(1) })}
              </dt>
              <dd className="font-mono tabular-nums">{formatPrice(totals.commission)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-1.5">
              <dt className="font-medium text-foreground">
                {type === "BUY" ? t("trade.totalBuy") : t("trade.totalSell")}
              </dt>
              <dd className="font-mono font-semibold tabular-nums">
                {formatPrice(totals.total)}
              </dd>
            </div>
          </dl>
        ) : null}

        {marketGate ? (
          <p
            role="status"
            className="rounded-md border border-border bg-surface-raised px-3 py-2 text-xs text-foreground"
          >
            {marketGate}
          </p>
        ) : null}

        {serverError ? (
          <p role="alert" className="text-xs text-negative">
            {serverError}
          </p>
        ) : null}

        {asOf && price !== null ? (
          <p className="text-xs text-muted-foreground">
            {t("trade.priceAsOf", { time: formatDateTime(asOf) })}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
            {t("trade.cancel")}
          </Button>
          <Button type="submit" loading={add.isPending} disabled={!canSubmit}>
            {type === "BUY" ? t("trade.submitBuy") : t("trade.submitSell")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
