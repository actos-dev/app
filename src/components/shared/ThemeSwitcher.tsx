"use client";

/**
 * Tema değiştirici (plan M-08): yalnızca server action çağırır; tema
 * `<html data-theme>` üzerinden sunucuda uygulandığı için istemci tarafında
 * ayrıca DOM'a dokunulmaz. Görsel tasarım birim 1.3/1.4'te gelecek.
 */
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { setTheme } from "@/i18n/actions";
import { isTheme, themes, type ThemeName } from "@/i18n/config";

export function ThemeSwitcher({
  theme,
  onChange,
}: {
  theme: ThemeName;
  /** Çerez yazımından sonra çalışır; hesaba senkron (B-15) için kullanılır. */
  onChange?: (theme: ThemeName) => void;
}) {
  const t = useTranslations("common");
  const themeNames = useTranslations("theme");
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{t("theme")}</span>
      <select
        className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-surface-foreground"
        value={theme}
        disabled={isPending}
        onChange={(event) => {
          const nextTheme = event.target.value;
          if (!isTheme(nextTheme)) {
            return;
          }
          startTransition(() => {
            void setTheme(nextTheme);
          });
          onChange?.(nextTheme);
        }}
      >
        {themes.map((value) => (
          <option key={value} value={value}>
            {themeNames(value)}
          </option>
        ))}
      </select>
    </label>
  );
}
