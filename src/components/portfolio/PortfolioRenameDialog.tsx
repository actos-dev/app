"use client";

/**
 * Portföy yeniden adlandırma diyaloğu (Faz 4 / Birim 4.2, U-05).
 *
 * `PUT /portfolios/{id}` ile ad güncellenir; başarıda detay ve liste tazelenir.
 * Ad zorunludur (backend `min_length=1`).
 */
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useRenamePortfolio } from "@/hooks/usePortfolios";
import { ApiError } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";

type PortfolioRenameDialogProps = {
  portfolioId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PortfolioRenameDialog({
  portfolioId,
  currentName,
  open,
  onOpenChange,
}: PortfolioRenameDialogProps) {
  const t = useTranslations("portfolio");
  const tErrors = useTranslations();
  const rename = useRenamePortfolio();
  const [name, setName] = useState(currentName);

  const nameError = name.trim().length === 0 ? t("rename.validation.nameRequired") : null;
  const serverError = rename.isError
    ? tErrors(translateBackendError(rename.error instanceof ApiError ? rename.error.code : undefined))
    : null;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      rename.reset();
      setName(currentName);
    }
    onOpenChange(next);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nameError) {
      return;
    }
    rename.mutate(
      { id: portfolioId, name: name.trim() },
      { onSuccess: () => handleOpenChange(false) },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("rename.title")}
      description={t("rename.description")}
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField label={t("rename.name")} error={nameError}>
          {(control) => (
            <Input
              {...control}
              type="text"
              autoComplete="off"
              value={name}
              onChange={(event) => setName(event.target.value)}
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
            {t("rename.cancel")}
          </Button>
          <Button type="submit" loading={rename.isPending}>
            {t("rename.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
