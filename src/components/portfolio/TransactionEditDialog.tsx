"use client";

/**
 * İşlem fiyat düzeltme diyaloğu (Faz 4 / Birim 4.2, U-05).
 *
 * `PUT /portfolios/{id}/transactions/{tx_id}` ile birim fiyat (ve istenirse
 * adet) düzeltilir; backend işlemi yeniden hesaplar. Bu uç piyasa saati
 * kuralından muaftır (elle fiyat düzeltmesi), bu yüzden seans kapısı burada
 * uygulanmaz.
 */
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useUpdateTransaction } from "@/hooks/usePortfolios";
import { ApiError } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";
import type { PortfolioTransaction } from "@/lib/portfolio/types";

type TransactionEditDialogProps = {
  portfolioId: string;
  transaction: PortfolioTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Türkçe klavye alışkanlığı: ondalık virgül de kabul edilir. */
function parseNumber(value: string): number {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function TransactionEditDialog({
  portfolioId,
  transaction,
  open,
  onOpenChange,
}: TransactionEditDialogProps) {
  const t = useTranslations("portfolio");
  const tErrors = useTranslations();
  const update = useUpdateTransaction(portfolioId);

  const [price, setPrice] = useState(String(transaction.price));
  const [quantity, setQuantity] = useState(String(transaction.quantity));

  const parsedPrice = parseNumber(price);
  const parsedQuantity = parseNumber(quantity);
  const priceError =
    price.trim().length === 0
      ? t("edit.validation.priceRequired")
      : !Number.isFinite(parsedPrice) || parsedPrice <= 0
        ? t("edit.validation.priceInvalid")
        : null;
  const quantityError =
    quantity.trim().length === 0
      ? t("edit.validation.quantityRequired")
      : !Number.isFinite(parsedQuantity) || parsedQuantity <= 0
        ? t("edit.validation.quantityInvalid")
        : null;

  const serverError = update.isError
    ? tErrors(
        translateBackendError(update.error instanceof ApiError ? update.error.code : undefined),
      )
    : null;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      update.reset();
      setPrice(String(transaction.price));
      setQuantity(String(transaction.quantity));
    }
    onOpenChange(next);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (priceError || quantityError) {
      return;
    }
    update.mutate(
      { txId: transaction.id, input: { price: parsedPrice, quantity: parsedQuantity } },
      { onSuccess: () => handleOpenChange(false) },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("edit.title")}
      description={t("edit.description", { ticker: transaction.ticker })}
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField label={t("edit.price")} error={priceError}>
          {(control) => (
            <Input
              {...control}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          )}
        </FormField>

        <FormField label={t("edit.quantity")} error={quantityError}>
          {(control) => (
            <Input
              {...control}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          )}
        </FormField>

        {serverError ? (
          <p role="alert" className="text-xs text-negative">
            {serverError}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
            {t("edit.cancel")}
          </Button>
          <Button type="submit" loading={update.isPending}>
            {t("edit.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
