/**
 * BIST sektör etiketleri (D9).
 *
 * Backend profili İngilizce sektör adları döner; arayüz bunları
 * `messages/*.json` içindeki `symbol.sectors` sözlüğünden lokalize eder.
 * Bilinmeyen değer ham haliyle gösterilir, bu yüzden eşleme katı değil
 * büyük/küçük harf ve kırpma normalizasyonu yapılır.
 */

/** İngilizce sektör adı → `symbol.sectors` anahtarı. */
export const SECTOR_KEYS = {
  Technology: "technology",
  "Financial Services": "financialServices",
  Healthcare: "healthcare",
  "Consumer Cyclical": "consumerCyclical",
  Industrials: "industrials",
  Energy: "energy",
  "Basic Materials": "basicMaterials",
  "Communication Services": "communicationServices",
  "Consumer Defensive": "consumerDefensive",
  "Real Estate": "realEstate",
  Utilities: "utilities",
} as const;

export type SectorKey = (typeof SECTOR_KEYS)[keyof typeof SECTOR_KEYS];

const SECTOR_KEY_BY_NAME: Readonly<Record<string, SectorKey>> = Object.fromEntries(
  Object.entries(SECTOR_KEYS).map(([name, key]) => [name.toLowerCase(), key]),
);

/** Sektör adını lokalizasyon anahtarına çözer; bilinmiyorsa `null`. */
export function sectorKey(sector: string | null | undefined): SectorKey | null {
  if (!sector) {
    return null;
  }
  return SECTOR_KEY_BY_NAME[sector.trim().toLowerCase()] ?? null;
}
