/**
 * Rapor yardımcıları (Faz 5 / Birim 5A.1, U-09, K-09).
 *
 * Framework'süz saf fonksiyonlar: hem sunucu hem istemci bileşenlerinde
 * kullanılabilir. Görünen metin üretmez; yalnız doğrulama ve yönlendirme
 * kararlarını verir.
 */
import type { Route } from "next";

import { REPORT_TYPES, type ReportType } from "./types";

/** `purpose` alanı backend `max_length` sınırı (U-09). */
export const PURPOSE_MAX_LENGTH = 500;

/** Rapor tipi dizesi geçerli mi? (backend allowlist: quick_report | deep_report) */
export function isReportType(value: string | null | undefined): value is ReportType {
  return value !== null && value !== undefined && (REPORT_TYPES as readonly string[]).includes(value);
}

/**
 * Kullanıcının amacını `purpose` alanına hazırlar (U-09).
 *
 * Baştaki/sondaki boşluk atılır; sınırı aşan girdi `null` döner ki çağıran
 * taraf gönderimi engelleyip doğrulama hatası gösterebilsin. Boş amaç
 * gönderilmez (backend `None` bekler).
 */
export function normalizePurpose(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.length > PURPOSE_MAX_LENGTH ? null : trimmed;
}

/** Rapor detayına tipli bağlantı (`/research/reports/{id}`). */
export function reportHref(id: number | string): Route {
  return `/research/reports/${id}` as Route;
}

/** Duyarlılık etiketini rozet varyantına eşler (bilinmeyen → nötr). */
export function sentimentVariant(sentiment: string | undefined): "positive" | "negative" | "neutral" {
  switch (sentiment?.toLowerCase()) {
    case "positive":
      return "positive";
    case "negative":
      return "negative";
    default:
      return "neutral";
  }
}

/** Duyarlılık etiketi i18n anahtarı (`reports.detail.sentiments.*`). */
export function sentimentLabelKey(sentiment: string | undefined): string {
  const normalized = sentiment?.toLowerCase();
  return normalized === "positive" || normalized === "negative" ? normalized : "neutral";
}
