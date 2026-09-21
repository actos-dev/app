/**
 * Bülten yardımcıları (Faz 5 / Birim 5A.3, U-08, S-15).
 *
 * Framework'süz saf fonksiyonlar: tarih/slot doğrulama, İstanbul günü, gün
 * gezinmesi, bağlantı kurma ve tazelik kararı. Sunucu ve istemci aynı
 * fonksiyonları kullanır; Vitest ile doğrudan test edilir.
 *
 * Tazelik (S-15) kararı UYDURULMAZ: slot pencere sınırları backend config'inde
 * (`digest.slot_times`) ve uç nokta olarak açık değildir. Bunun yerine
 * backend'e "şu an hangi pencere?" diye sorulur (`GET /digest?at=...`); dönen
 * bülten güncel bültenle aynıysa taze, 404 ise bayat kabul edilir. Ağ/5xx
 * durumunda karar bilinemez ve "unknown" döner (yanıltıcı rozet yok).
 */
import type { Route } from "next";

import { DIGEST_SLOTS, type Digest, type DigestSlot } from "./types";

/** Bülten slotlarının hesaplandığı saat dilimi (backend `digest.timezone`). */
export const DIGEST_TIME_ZONE = "Europe/Istanbul";

/** Tazelik durumu: kesin taze / kesin bayat / bilinemez. */
export type DigestFreshness = "current" | "stale" | "unknown";

/** Backend `GET /digest?at=` yanıtının tazelik kararı için gereken kısmı. */
export type DigestWindowResult = {
  status: number;
  data: Digest | null;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const istanbulDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: DIGEST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `YYYY-MM-DD` biçimini ve takvimde gerçekten var olduğunu doğrular. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Değerin bilinen bir slot olup olmadığını söyler. */
export function isDigestSlot(value: unknown): value is DigestSlot {
  return typeof value === "string" && (DIGEST_SLOTS as readonly string[]).includes(value);
}

/** `searchParams` değerini tek string'e indirger (dizi ise ilk öğe). */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Verilen anın İstanbul takvim günü (`YYYY-MM-DD`). */
export function todayInIstanbul(now: Date = new Date()): string {
  const parts = istanbulDateFormatter.formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

/**
 * ISO tarihi gün bazında kaydırır. UTC aritmetiği kullanılır; saat dilimi
 * kayması gün sınırını bozmaz.
 */
export function shiftIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Bülten penceresini tazelik kararına çevirir.
 *
 * - Pencere bülteni güncel bültenle aynı id ise `current`,
 * - pencere 404 ise (bu aralık için üretilmiş bülten yok) `stale`,
 * - ağ hatası/5xx gibi belirsiz durumlarda `unknown`.
 */
export function resolveDigestFreshness(
  current: Digest,
  windowResult: DigestWindowResult,
): DigestFreshness {
  if (windowResult.status === 404) {
    return "stale";
  }
  if (windowResult.status >= 200 && windowResult.status < 300 && windowResult.data) {
    return windowResult.data.id === current.id ? "current" : "stale";
  }
  return "unknown";
}

/**
 * `/digest` arşiv bağlantısı üretir. Tarih her zaman taşınır; slot yoksa
 * yalnız gün listesi açılır. typedRoutes dinamik query string'i statik olarak
 * ifade edemediğinden tek zorunlu cast; hedef `/digest?...` deseninde kalır.
 */
export function digestHref(date: string, slot?: DigestSlot): Route {
  const params = new URLSearchParams({ date });
  if (slot) {
    params.set("slot", slot);
  }
  return `/digest?${params.toString()}` as Route;
}
