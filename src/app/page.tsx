/**
 * Birim 1.2 kanıt sayfası: sunucu tarafı `getTranslations`, istemci tarafı
 * `useTranslations` (switcher etiketleri) ve SSR tema/dil çıktısı.
 * Ürün arayüzü sonraki birimlerde gelecek; bu sayfa yalnızca altyapıyı kanıtlar.
 */
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { resolveTheme, THEME_COOKIE } from "@/i18n/config";

export default async function Home() {
  const [t, app, cookieStore] = await Promise.all([
    getTranslations("home"),
    getTranslations("app"),
    cookies(),
  ]);
  const theme = resolveTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <main className="flex min-h-dvh flex-col items-start gap-6 bg-background p-6 text-foreground">
      <h1 className="text-2xl font-semibold">{app("name")}</h1>
      <p className="max-w-prose text-sm text-muted-foreground">{t("placeholder")}</p>
      <div className="flex flex-wrap items-center gap-4">
        <LocaleSwitcher />
        <ThemeSwitcher theme={theme} />
      </div>
    </main>
  );
}
