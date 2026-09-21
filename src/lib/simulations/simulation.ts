/**
 * Simülasyon yardımcıları (Faz 5 / Birim 5A.2, U-03, U-06).
 *
 * Framework'süz saf fonksiyonlar: hem sunucu hem istemci bileşenlerinde
 * kullanılabilir. Görünen metin üretmez; yalnız anlam ve doğrulama
 * kararlarını verir.
 *
 * `bounds` anlamı backend'den çıkarıldı (`montecarlo.confidence_interval`):
 * `bounds` alt ve üst kuyruktan ATILAN olasılıktır; bant `1 - 2*bounds`
 * olasılığı kapsar. Yani `0.05` → %90, `0.025` → %95, `0.005` → %99.
 */
import type {
  SimulationDirection,
  SimulationHistoryDetail,
  SimulationResult,
} from "./types";

/** Gün sayısı sınırları (backend `Query(..., ge=1, le=370)`). */
export const SIMULATION_MIN_DAYS = 1;
export const SIMULATION_MAX_DAYS = 370;

/** Varsayılan gün sayısı; backend varsayılanı `days` zorunlu olduğundan UI seçer. */
export const SIMULATION_DEFAULT_DAYS = 30;

/**
 * Güven aralığı seçenekleri. `bounds` alt/üst kuyruktan atılan olasılıktır;
 * görünen yüzde `1 - 2*bounds`. Backend varsayılanı `0.05` (%90).
 */
export const SIMULATION_BOUNDS_OPTIONS = [
  { value: "0.05", percent: 90 },
  { value: "0.025", percent: 95 },
  { value: "0.005", percent: 99 },
] as const;

export type SimulationBounds = (typeof SIMULATION_BOUNDS_OPTIONS)[number]["value"];

/** Backend varsayılanı. */
export const SIMULATION_DEFAULT_BOUNDS: SimulationBounds = "0.05";

/** Gün sayısı geçerli mi? (tam sayı ve backend aralığında) */
export function isValidSimulationDays(days: number): boolean {
  return (
    Number.isInteger(days) && days >= SIMULATION_MIN_DAYS && days <= SIMULATION_MAX_DAYS
  );
}

/** `bounds` değeri izinli seçeneklerden biri mi? */
export function isSimulationBounds(value: string | null | undefined): value is SimulationBounds {
  return (
    value !== null &&
    value !== undefined &&
    SIMULATION_BOUNDS_OPTIONS.some((option) => option.value === value)
  );
}

/**
 * Hedef fiyat girdisini backend'e hazırlar.
 *
 * Boş → `null` (istek `target` parametresi gönderilmez; backend otomatik +%10
 * üretir). Geçersiz (sayı değil, ≤ 0) → `undefined` ki çağıran gönderimi
 * baştan engelleyip doğrulama hatası gösterebilsin. Geçerli → normalleştirilmiş
 * string (backend `target` parametresi string bekler).
 */
export function normalizeTarget(value: string): string | null | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const numeric = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return undefined;
  }
  return String(numeric);
}

/**
 * Bant kapsamını (`1 - 2*bounds`) yüzde tamsayıya çevirir.
 *
 * `bounds` kayıtta string olduğundan sayıya çevrilir; geçersizse `null`.
 */
export function confidencePercent(bounds: string | number | null | undefined): number | null {
  if (bounds === null || bounds === undefined || bounds === "") {
    return null;
  }
  const numeric = typeof bounds === "number" ? bounds : Number(bounds);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 0.5) {
    return null;
  }
  return Math.round((1 - 2 * numeric) * 100);
}

/**
 * Hedefin yönüne göre gösterilecek olasılığı seçer.
 *
 * `direction === "below"` ise hedefin altına düşme olasılığı (`prob_below`),
 * aksi halde hedefe ulaşma olasılığı (`prob_above`) anlamlıdır. `direction`
 * yoksa hedef `"auto"` kabul edilir ve `prob_above` kullanılır.
 */
export function directionalProbability(input: {
  direction?: SimulationDirection;
  prob_above?: number;
  prob_below?: number;
}): number | null {
  const direction = input.direction ?? "above";
  const raw = direction === "below" ? input.prob_below : input.prob_above;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

/** Geçmiş detayından yönü çıkarır; kayıpta yoksa `"above"` varsayılır. */
export function historyDirection(detail: SimulationHistoryDetail): SimulationDirection {
  return detail.result.direction === "below" ? "below" : "above";
}

/** Geçmiş detayından olasılığı çıkarır (yön varsa ona göre). */
export function historyProbability(detail: SimulationHistoryDetail): number | null {
  return directionalProbability({
    direction: historyDirection(detail),
    prob_above: detail.result.prob_above,
    prob_below: detail.result.prob_below,
  });
}

/** Koşu sonucundan yüzde (0-100) olasılığı çıkarır. */
export function resultProbabilityPercent(result: SimulationResult): number | null {
  const value = directionalProbability(result);
  return value === null ? null : value * 100;
}

/**
 * Olasılığın "güçlü / zayıf / belirsiz" sınıfı.
 *
 * Hedefe ulaşma (`above`) yönünde yüksek olasılık olumlu; hedefin altına düşme
 * (`below`) yönünde yüksek olasılık olumsuzdur. Nötr bantta "belirsiz" döner.
 * Yalnız color/badge seçiminde kullanılır; karar mercii değildir.
 */
export type ProbabilityTone = "positive" | "negative" | "neutral";

export function probabilityTone(
  probability: number | null,
  direction: SimulationDirection,
): ProbabilityTone {
  if (probability === null) {
    return "neutral";
  }
  const favourable = direction === "above" ? probability >= 0.7 : probability <= 0.3;
  const unfavourable = direction === "above" ? probability <= 0.3 : probability >= 0.7;
  if (favourable) {
    return "positive";
  }
  if (unfavourable) {
    return "negative";
  }
  return "neutral";
}

/**
 * Güven aralığı bandının, hedefe göre okunabilir şekilde sıralanmış aralığı.
 * `min`/`max` backend'den gelir; geçersizse `null`.
 */
export function confidenceRange(
  confidence: SimulationResult["confidence"] | null | undefined,
): { min: number; max: number } | null {
  if (
    !confidence ||
    typeof confidence.min !== "number" ||
    typeof confidence.max !== "number" ||
    !Number.isFinite(confidence.min) ||
    !Number.isFinite(confidence.max)
  ) {
    return null;
  }
  return {
    min: Math.min(confidence.min, confidence.max),
    max: Math.max(confidence.min, confidence.max),
  };
}

/**
 * Hedef fiyatı sayıya çevirir; `"auto"` veya geçersizse `null`.
 *
 * Backend hedef verilmediğinde `"auto"` dizesini saklar; UI bu durumda
 * "otomatik hedef" metnini gösterir.
 */
export function targetNumber(target: string | null | undefined): number | null {
  if (target === null || target === undefined || target === "auto") {
    return null;
  }
  const numeric = Number(target);
  return Number.isFinite(numeric) ? numeric : null;
}