/**
 * next-intl istek yapılandırması (plan M-09, P-09).
 *
 * Dil her istekte çerez → `Accept-Language` → varsayılan sırasıyla çözülür
 * (URL'de dil öneki yoktur). Mesajlar `import()` ile tembel yüklenir; yalnız
 * istenen dilin kataloğu değerlendirilir. `next.config.ts` bu dosyayı
 * `createNextIntlPlugin()` ile bağlar.
 */
import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { LOCALE_COOKIE, resolveLocale, type Locale } from "./config";

const messagesByLocale = {
  tr: () => import("../../messages/tr.json"),
  en: () => import("../../messages/en.json"),
} satisfies Record<Locale, () => Promise<{ default: Record<string, unknown> }>>;

export default getRequestConfig(async () => {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerList.get("accept-language") ?? undefined,
  );

  return {
    locale,
    messages: (await messagesByLocale[locale]()).default,
  };
});
