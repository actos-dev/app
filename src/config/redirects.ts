/**
 * Eski (Vite SPA) URL'lerinin yeni route haritasına kalıcı yönlendirmeleri
 * (plan §4, S-27).
 *
 * `next.config.ts` `redirects()` bu tabloyu döner; testler de aynı modülü
 * içe aktarır. Özel yollar (`/stocks/:ticker`, `/reports/:id`) genel
 * yollardan ÖNCE gelir ki eşleşme sırası belirsizleşmesin.
 */
export type LegacyRedirect = {
  source: string;
  destination: string;
  permanent: true;
};

export const legacyRedirects: LegacyRedirect[] = [
  { source: "/stocks/:ticker", destination: "/symbol/:ticker", permanent: true },
  { source: "/stocks", destination: "/markets", permanent: true },
  { source: "/currency", destination: "/markets", permanent: true },
  { source: "/metals", destination: "/markets", permanent: true },
  { source: "/ipos", destination: "/markets", permanent: true },
  { source: "/reports/:id", destination: "/research/reports/:id", permanent: true },
  { source: "/reports", destination: "/research/reports", permanent: true },
  { source: "/simulation", destination: "/research/simulation", permanent: true },
  { source: "/advisor", destination: "/research/advisor", permanent: true },
  { source: "/portfolios/:id", destination: "/portfolio/:id", permanent: true },
  { source: "/portfolios", destination: "/portfolio", permanent: true },
];
