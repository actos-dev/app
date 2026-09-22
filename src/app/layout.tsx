import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { AuthUnauthorizedListener } from "@/components/auth/AuthUnauthorizedListener";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { WebVitals } from "@/components/providers/WebVitals";
import { ConsentBanner } from "@/components/shared/ConsentBanner";
import { ServiceWorkerRegistrar } from "@/components/shared/ServiceWorkerRegistrar";
import { Toaster } from "@/components/ui/toaster";
import { getSiteUrl } from "@/config/site";
import { CONSENT_COOKIE } from "@/lib/consent";
import { resolveTheme, THEME_COOKIE, themeColors } from "@/i18n/config";

import "./globals.css";

/**
 * Kök layout (plan M-08, M-09, S-04): dil, tema ve çerez rızası istekten
 * okunur; tema/dil doğrudan `<html>` niteliklerine yazılır. Çerez okunduğu için
 * tüm ağaç dinamik render edilir; bu hem FOUC/hydration uyuşmazlığını sıfırlar
 * hem de istek başına CSP nonce'ının (S-05, `src/proxy.ts`) tüm sayfalara
 * uygulanabilmesini sağlar.
 */
async function readTheme() {
  const cookieStore = await cookies();
  return resolveTheme(cookieStore.get(THEME_COOKIE)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    // Kanonik/OG URL'leri için tek taban (plan M-07).
    metadataBase: new URL(getSiteUrl()),
    // Alt sayfa başlıkları `%s · Florence` biçiminde birleşir (plan M-07).
    title: { default: t("app.name"), template: `%s · ${t("app.name")}` },
    description: t("app.description"),
    // iOS ana ekran uygulaması: tam ekran mod + başlık (Faz 6 / Birim 6.4).
    appleWebApp: {
      capable: true,
      title: t("app.name"),
      statusBarStyle: "black-translucent",
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  return { themeColor: themeColors[await readTheme()] };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const [locale, theme] = await Promise.all([getLocale(), readTheme()]);
  // Rıza çerezi YOKSA karar belirsizdir ve banner sunucuda render edilir;
  // karar verilmişse (kabul ya da ret) hiç gösterilmez (S-04, FOUC yok).
  const needsConsent = cookieStore.get(CONSENT_COOKIE) === undefined;

  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <AuthUnauthorizedListener />
        <WebVitals />
        <ServiceWorkerRegistrar />
        <NextIntlClientProvider>
          <QueryProvider>{children}</QueryProvider>
          <ConsentBanner needsConsent={needsConsent} />
        </NextIntlClientProvider>
        <Toaster theme={theme} />
      </body>
    </html>
  );
}
