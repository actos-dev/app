/**
 * CSV dışa aktarım dosya adı (Faz 4 / Birim 4.3).
 *
 * Backend `Content-Disposition` göndermediği için tarayıcı dosya adını
 * URL'den türetir; bu da portföy kimliğini (UUID) kullanıcıya gösterir.
 * Ad bu yüzden istemcide belirlenir ve güvenli karakterlere indirgenir.
 */

/** Türkçe harflerin ASCII karşılıkları; dizin adında taşınabilirlik için. */
const TR_FOLD: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

/**
 * Metni dosya adı için güvenli parçaya indirger: Türkçe harfler ASCII'ye
 * katlanır, aksanlar atılır, alfanümerik olmayan her şey `-` olur, baş/son
 * tireler kırpılır ve uzunluk sınırlanır. Güvenli parça kalmazsa boş döner
 * (çağıran taraf kimliğe düşer).
 */
export function sanitizeFileSegment(value: string, maxLength = 60): string {
  const folded = Array.from(value.trim())
    .map((char) => TR_FOLD[char] ?? char)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const slug = folded
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, maxLength).replace(/-+$/g, "");
}

/**
 * Çevrilmiş önek ile `{onek}-{ad}.csv` adını üretir. Ad güvenli parça
 * bırakmıyorsa `fallback` (portföy kimliği) kullanılır.
 */
export function buildPortfolioCsvFilename(
  prefix: string,
  name: string,
  fallback: string,
): string {
  const segment = sanitizeFileSegment(name) || sanitizeFileSegment(fallback) || "portfolio";
  return `${prefix}-${segment}.csv`;
}
