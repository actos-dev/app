/**
 * Web uygulaması manifesti (Faz 6 / Birim 6.4, plan M-12).
 *
 * Next, `app/manifest.ts`'i `/manifest.webmanifest` olarak servis eder ve
 * `<link rel="manifest">` etiketini otomatik ekler. Metinler kataloglardan
 * gelir (`app.*`); `lang` sabit `tr`'dir (ürün varsayılanı).
 *
 * İkonlar `scripts/generate-icons.sh` ile `src/app/icon.svg`'ten üretilir;
 * maskable sürüm tam kanama arka plan + güvenli alana sığdırılmış işaret taşır.
 */
import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("app");

  return {
    name: t("name"),
    short_name: t("name"),
    description: t("description"),
    lang: "tr",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    // Tema token'ları: `themeColors.dark` ile aynı koyu zemin (Faz 1).
    background_color: "#0b0e14",
    theme_color: "#0b0e14",
    categories: ["finance", "business", "productivity"],
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
