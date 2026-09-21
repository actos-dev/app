/**
 * Enstrüman sembolü çözümleyici (Faz 3 / Birim 3.3).
 *
 * `/symbol/[symbol]` hem BIST hisselerini hem de döviz/kıymetli maden
 * enstrümanlarını taşır. Backend'de iki ayrı dünya vardır:
 *   - BIST: `/companies/*`, `/price/history/*`, `/news/*` (ticker = BIST kodu),
 *   - economy: `/economy/*` (kanonik sembol = `SYMBOL_REGISTRY` anahtarı).
 *
 * Kanonik economy sembolleri `backend/src/finance/symbols.py::SYMBOL_REGISTRY`
 * kaynağından birebir çıkarıldı (frontend backend'i import edemez). Registry
 * değişirse bu liste elle güncellenir; bilinmeyen sembol BIST varsayılır ve
 * doğrulama `/companies/info` 404'ü ile yapılır (bkz. sayfa yükleyicisi).
 *
 * Saf fonksiyonlar: sunucu ve istemci aynı sonucu üretir, test edilebilir.
 */

/** Sembolün ait olduğu backend dikey dilimi. */
export type SymbolKind = "bist" | "economy";

export type ResolvedSymbol = {
  kind: SymbolKind;
  /** Kullanıcının verdiği biçimin büyük harfe çevrilmiş hali (URL/başlık). */
  symbol: string;
  /** Backend'e gidecek kanonik sembol (BIST'te ticker, economy'de registry anahtarı). */
  canonical: string;
};

/** `SYMBOL_REGISTRY` döviz kodları (ISO 4217, TRY bazlı). */
const FX_SYMBOLS = [
  "USD", "EUR", "GBP", "CHF", "JPY", "AUD", "CAD", "DKK", "SEK", "NOK",
  "RUB", "AED", "KWD", "SAR", "QAR", "BHD", "OMR", "JOD", "PLN", "CZK",
  "HUF", "RON", "BGN", "UAH", "CNY", "HKD", "SGD", "INR", "PKR", "MXN",
  "ZAR", "BRL", "IDR", "MYR", "THB", "PHP", "KRW", "ILS", "EGP", "CLP",
  "ARS", "MAD", "TND", "LBP", "IQD", "LYD", "NZD", "ISK",
] as const;

/** `SYMBOL_REGISTRY` metal + emtia kanonik sembolleri. */
const METAL_SYMBOLS = [
  "XAU-ONS", "XAG-ONS", "XPT-ONS", "XPD-ONS",
  "XAU-GRAM", "XAG-GRAM", "XPT-GRAM", "XPD-GRAM",
  "XAU-HAS", "XAU-CEYREK", "XAU-YARIM", "XAU-TAM", "XAU-CUMHURIYET",
  "XAU-ATA", "XAU-14-AYAR", "XAU-18-AYAR", "XAU-22-BILEZIK",
  "XAU-IKIBUCUK", "XAU-BESLI", "XAU-GREMSE", "XAU-RESAT", "XAU-HAMIT",
  "COIL-BRENT-USD", "COIL-WTI-USD",
] as const;

/** Tüm kanonik economy sembolleri (registry çıktısı). */
export const ECONOMY_SYMBOLS: readonly string[] = [...FX_SYMBOLS, ...METAL_SYMBOLS];

const ECONOMY_SYMBOL_SET: ReadonlySet<string> = new Set(ECONOMY_SYMBOLS);

/**
 * Registry'deki `legacy_name` → kanonik eşlemesi (geçiş dönemi).
 *
 * Eski `web/` bağlantıları (`/symbol/gram-altin` gibi) yeni kanonik sembole
 * çözülsün diye tutulur; registry'den kaldırıldığında silinebilir.
 */
const LEGACY_ECONOMY_SYMBOLS: Readonly<Record<string, string>> = {
  ons: "XAU-ONS",
  "gram-altin": "XAU-GRAM",
  gumus: "XAG-GRAM",
  "gram-platin": "XPT-GRAM",
  "gram-paladyum": "XPD-GRAM",
  "gram-has-altin": "XAU-HAS",
  "ceyrek-altin": "XAU-CEYREK",
  "yarim-altin": "XAU-YARIM",
  "tam-altin": "XAU-TAM",
  "cumhuriyet-altini": "XAU-CUMHURIYET",
  "ata-altin": "XAU-ATA",
  "14-ayar-altin": "XAU-14-AYAR",
  "18-ayar-altin": "XAU-18-AYAR",
  "22-ayar-bilezik": "XAU-22-BILEZIK",
  "ikibucuk-altin": "XAU-IKIBUCUK",
  "besli-altin": "XAU-BESLI",
  "gremse-altin": "XAU-GREMSE",
  "resat-altin": "XAU-RESAT",
  "hamit-altin": "XAU-HAMIT",
};

/** Verilen (büyük harfli) değer kanonik economy sembolü mü? */
export function isEconomySymbol(symbol: string): boolean {
  return ECONOMY_SYMBOL_SET.has(symbol);
}

/**
 * Kullanıcı girdisini enstrüman türüne çözer.
 *
 * Economy kanonik semboller (ve legacy adları) tanınır; geri kalan her şey
 * BIST kabul edilir. BIST doğrulaması burada yapılmaz — `/companies/info`
 * yanıtı 404 ise sayfa `notFound()` döner.
 */
export function resolveSymbol(input: string): ResolvedSymbol {
  const symbol = input.trim().toUpperCase();
  if (isEconomySymbol(symbol)) {
    return { kind: "economy", symbol, canonical: symbol };
  }
  const legacy = LEGACY_ECONOMY_SYMBOLS[symbol.toLowerCase()];
  if (legacy !== undefined) {
    return { kind: "economy", symbol, canonical: legacy };
  }
  return { kind: "bist", symbol, canonical: symbol };
}
