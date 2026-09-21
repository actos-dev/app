"use client";

/**
 * Yeni portföy diyaloğu (Faz 4 / Birim 4.1, U-13).
 *
 * Ad + başlangıç bakiyesi zod ile doğrulanır (bakiye `> 0`). Başarıda liste
 * sorguları `useCreatePortfolio` içinde tazelenir ve diyalog kapanır. Tetikleyici
 * dışarıdan verilebilir (boş durum CTA'sı aynı diyaloğu farklı etiketle açar).
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useCreatePortfolio } from "@/hooks/usePortfolios";

type PortfolioCreateDialogProps = {
  /** Diyaloğu açan öğe; verilmezse "+ Yeni portföy" butonu kullanılır. */
  trigger?: ReactElement;
};

export function PortfolioCreateDialog({ trigger }: PortfolioCreateDialogProps) {
  const t = useTranslations("portfolio");
  const [open, setOpen] = useState(false);
  const create = useCreatePortfolio();

  const schema = z.object({
    name: z.string().trim().min(1, t("create.validation.nameRequired")),
    initialBalance: z
      .string()
      .trim()
      .min(1, t("create.validation.balanceRequired"))
      .refine((value) => {
        // Türkçe klavye alışkanlığı: ondalık virgül de kabul edilir.
        const parsed = Number(value.replace(",", "."));
        return Number.isFinite(parsed) && parsed > 0;
      }, t("create.validation.balanceInvalid")),
  });
  type CreateValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", initialBalance: "" },
  });

  const onSubmit = handleSubmit((values) => {
    create.mutate(
      {
        name: values.name.trim(),
        initialBalance: Number(values.initialBalance.replace(",", ".")),
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
        }
      }}
      trigger={
        trigger ?? (
          <Button>
            <Plus aria-hidden="true" className="size-4" />
            {t("new")}
          </Button>
        )
      }
      title={t("create.title")}
      description={t("create.description")}
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField label={t("create.name")} error={errors.name?.message}>
          {(control) => (
            <Input
              {...control}
              type="text"
              autoComplete="off"
              placeholder={t("create.namePlaceholder")}
              {...register("name")}
            />
          )}
        </FormField>

        <FormField
          label={t("create.initialBalance")}
          hint={t("create.initialBalanceHint")}
          error={errors.initialBalance?.message}
        >
          {(control) => (
            <Input
              {...control}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              {...register("initialBalance")}
            />
          )}
        </FormField>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            {t("create.cancel")}
          </Button>
          <Button type="submit" loading={create.isPending}>
            {t("create.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
