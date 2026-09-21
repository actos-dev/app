import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { resolveTheme, THEME_COOKIE, themeColors } from "@/i18n/config";

import "./globals.css";

/**
 * Kök layout (plan M-08, M-09): dil ve tema istekten okunur ve doğrudan
 * `<html>` niteliklerine yazılır. Çerez okunduğu için tüm ağaç dinamik
 * render edilir; FOUC ve hydration uyuşmazlığı bu sayede sıfırdır.
 */
async function readTheme() {
  const cookieStore = await cookies();
  return resolveTheme(cookieStore.get(THEME_COOKIE)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("app.name"),
    description: t("app.description"),
  };
}

export async function generateViewport(): Promise<Viewport> {
  return { themeColor: themeColors[await readTheme()] };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, theme] = await Promise.all([getLocale(), readTheme()]);

  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
