/**
 * Site kök adresi (plan M-07, S-27).
 *
 * `NEXT_PUBLIC_SITE_URL` tek kaynaktır; tanımsızsa yerel geliştirme adresine
 * düşer. `metadataBase`, sitemap ve robots aynı yardımcıyı kullanır ki kanonik
 * URL'ler birbiriyle tutarlı kalsın. Sondaki eğik çizgiler kırpılır.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const candidate = configured && configured.length > 0 ? configured : "http://localhost:3000";
  try {
    return new URL(candidate).toString().replace(/\/+$/, "");
  } catch {
    return "http://localhost:3000";
  }
}
