"use client";

/**
 * Yeni bot diyaloğu (Faz 5 / Birim 5B.3, U-11).
 *
 * Backend şeması birebir uygulanır: `username` 3-255 karakter, `password`
 * opsiyonel ve verilirse en az 10 karakter. Şifre backend tarafından
 * üretilebilir ve yalnızca bu yanıtta BİR KEZ döner; bu yüzden başarıdan
 * sonra form yerine tek seferlik kimlik bilgileri gösterilir ve diyalog
 * kapanınca bir daha erişilemez.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useCreateBot } from "@/hooks/useBots";
import type { BotCreateResponse } from "@/lib/bots/types";

type BotCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BotCreateDialog({ open, onOpenChange }: BotCreateDialogProps) {
  const t = useTranslations("bots");
  const create = useCreateBot();
  const [created, setCreated] = useState<BotCreateResponse | null>(null);

  const schema = z
    .object({
      username: z
        .string()
        .trim()
        .min(3, t("form.usernameTooShort"))
        .max(255, t("form.usernameTooLong")),
      password: z.string(),
    })
    .refine((values) => values.password.length === 0 || values.password.length >= 10, {
      path: ["password"],
      message: t("form.passwordTooShort"),
    });
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await create.mutateAsync({
        username: values.username.trim(),
        ...(values.password.length > 0 ? { password: values.password } : {}),
      });
      setCreated(result);
      reset();
    } catch {
      // Hata toast'ı hook tarafında gösterilir; diyalog açık kalır.
    }
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setCreated(null);
      reset();
    }
    onOpenChange(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("form.dialogTitle")}
      description={t("form.dialogDescription")}
      footer={
        created ? (
          <Button type="button" onClick={() => handleOpenChange(false)}>
            {t("form.close")}
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" form="bot-create-form" loading={isSubmitting}>
              {t("form.submit")}
            </Button>
          </>
        )
      }
    >
      {created ? (
        <div className="flex flex-col gap-3">
          <p className="rounded-md border border-warning/40 bg-surface px-3 py-2 text-sm text-foreground">
            {t("passwordOnce")}
          </p>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{t("form.emailLabel")}</span>
            <Input readOnly value={created.email} className="font-mono" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{t("form.passwordLabel")}</span>
            <Input readOnly value={created.password} className="font-mono" />
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <KeyRound aria-hidden="true" className="size-3.5" />
            {t("form.passwordOnlyOnce")}
          </p>
        </div>
      ) : (
        <form id="bot-create-form" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField
            label={t("form.username")}
            hint={t("form.usernameHint")}
            error={errors.username?.message}
          >
            {(control) => (
              <Input
                {...control}
                type="text"
                autoComplete="off"
                {...register("username")}
              />
            )}
          </FormField>

          <FormField
            label={t("form.password")}
            hint={t("form.passwordHint")}
            error={errors.password?.message}
          >
            {(control) => (
              <PasswordInput {...control} autoComplete="new-password" {...register("password")} />
            )}
          </FormField>
        </form>
      )}
    </Dialog>
  );
}
