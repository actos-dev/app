"use client";

/**
 * Dil değiştirici (plan M-09): yalnızca server action çağırır.
 * Görsel tasarım birim 1.3/1.4'te primitiflerle gelecek; bu sürüm yalın bir
 * `<select>` ve erişilebilir etiketten oluşur.
 */
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { setLocale } from "@/i18n/actions";
import { isLocale, locales } from "@/i18n/config";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const localeNames = useTranslations("locale");
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{t("language")}</span>
      <select
        className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-surface-foreground"
        value={locale}
        disabled={isPending}
        onChange={(event) => {
          const nextLocale = event.target.value;
          if (!isLocale(nextLocale)) {
            return;
          }
          startTransition(() => {
            void setLocale(nextLocale);
          });
        }}
      >
        {locales.map((value) => (
          <option key={value} value={value}>
            {localeNames(value)}
          </option>
        ))}
      </select>
    </label>
  );
}
