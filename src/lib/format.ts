/**
 * Biçimlendirme katmanı (plan D-07, S-14, K-02).
 *
 * Tüm `Intl.*` çağrıları burada toplanır; locale parametreli saf fonksiyonlar
 * sunucu bileşenlerinde de kullanılabilir. Formatter'lar modül düzeyinde
 * önbelleklenir (P-06) — render başına yeni `Intl` nesnesi üretilmez.
 *
 * Kurallar:
 *   - Geçersiz/eksik değer her zaman "—" döner; ekrana `NaN`/`null` basılmaz.
 *   - Türkçe ondalık virgül, binlik nokta; İngilizce tersi (S-14).
 *   - İşaret (+/−) ve renk çift kodlaması `Delta` bileşeninde tamamlanır.
 *   - Saat dilimi varsayılanı `Europe/Istanbul` (borsa saati).
 */
import { useMemo } from "react";
import { useLocale } from "next-intl";

import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

/** Geçersiz değer için yer tutucu. */
export const EMPTY_VALUE = "—";

/** Piyasa/finans saat dilimi. */
export const MARKET_TIME_ZONE = "Europe/Istanbul";

/** Tipografik eksi işareti (U+2212); ham "-" yerine kullanılır. */
export const MINUS_SIGN = "\u2212";

export type FormattableDate = string | number | Date;

const numberFormatterCache = new Map<string, Intl.NumberFormat>();
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

/** `number | null/undefined` → sonlu sayı veya `null`. */
function toFiniteNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Geçerli tarih nesnesi veya `null`. */
function toDate(value: FormattableDate | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getNumberFormatter(
  locale: Locale,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = numberFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatterCache.set(key, formatter);
  }
  return formatter;
}

function getDateFormatter(
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = dateFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateFormatterCache.set(key, formatter);
  }
  return formatter;
}

export type PriceFormatOptions = {
  locale?: Locale;
  /** Ondalık basamak sayısı (min = max). Varsayılan 2. */
  fractionDigits?: number;
};

/**
 * Fiyat/sayı biçimi: binlik ayraç + sabit ondalık, tabular hizaya uygun.
 * Ör. `formatPrice(1234.5)` → `"1.234,50"` (tr).
 */
export function formatPrice(
  value: number | null | undefined,
  options: PriceFormatOptions = {},
): string {
  const numeric = toFiniteNumber(value);
  if (numeric === null) {
    return EMPTY_VALUE;
  }
  const fractionDigits = options.fractionDigits ?? 2;
  const formatter = getNumberFormatter(options.locale ?? defaultLocale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    useGrouping: true,
  });
  return formatter.format(numeric);
}

export type ChangeFormatOptions = {
  locale?: Locale;
  fractionDigits?: number;
};

/** İşaretli değişim değeri: pozitifte `+`, negatifte `−`, sıfırda işaretsiz. */
export function formatChangeValue(
  value: number | null | undefined,
  options: ChangeFormatOptions = {},
): string {
  const numeric = toFiniteNumber(value);
  if (numeric === null) {
    return EMPTY_VALUE;
  }
  const fractionDigits = options.fractionDigits ?? 2;
  const formatter = getNumberFormatter(options.locale ?? defaultLocale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    useGrouping: true,
  });
  const formatted = formatter.format(Math.abs(numeric));
  if (numeric > 0) {
    return `+${formatted}`;
  }
  if (numeric < 0) {
    return `${MINUS_SIGN}${formatted}`;
  }
  return formatted;
}

/** İşaretli yüzde: değer zaten yüzde birimidir (2.41 → `"+2,41%"`). */
export function formatChangePercent(
  value: number | null | undefined,
  options: ChangeFormatOptions = {},
): string {
  if (toFiniteNumber(value) === null) {
    return EMPTY_VALUE;
  }
  return `${formatChangeValue(value, options)}%`;
}

/** Büyük sayı kısaltması: `1500000` → `"1,5 Mn"` (tr) / `"1.5M"` (en). */
export function formatCompactNumber(
  value: number | null | undefined,
  options: ChangeFormatOptions = {},
): string {
  const numeric = toFiniteNumber(value);
  if (numeric === null) {
    return EMPTY_VALUE;
  }
  const formatter = getNumberFormatter(options.locale ?? defaultLocale, {
    notation: "compact",
    maximumFractionDigits: options.fractionDigits ?? 1,
  });
  return formatter.format(numeric);
}

export type DateTimeFormatOptions = {
  locale?: Locale;
  timeZone?: string;
};

/** Tarih + saat (varsayılan `Europe/Istanbul`). Geçersizse "—". */
export function formatDateTime(
  value: FormattableDate | null | undefined,
  options: DateTimeFormatOptions = {},
): string {
  const date = toDate(value);
  if (!date) {
    return EMPTY_VALUE;
  }
  const formatter = getDateFormatter(options.locale ?? defaultLocale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: options.timeZone ?? MARKET_TIME_ZONE,
  });
  return formatter.format(date);
}

export type DateFormatOptions = DateTimeFormatOptions & Intl.DateTimeFormatOptions;

/** Tarih (yalnız gün; varsayılan `dateStyle: "long"`). Geçersizse "—". */
export function formatDate(
  value: FormattableDate | null | undefined,
  options: DateFormatOptions = {},
): string {
  const date = toDate(value);
  if (!date) {
    return EMPTY_VALUE;
  }
  const { locale, timeZone, ...dateOptions } = options;
  const formatter = getDateFormatter(locale ?? defaultLocale, {
    dateStyle: "long",
    timeZone: timeZone ?? MARKET_TIME_ZONE,
    ...dateOptions,
  });
  return formatter.format(date);
}

/** Yalnız saat (varsayılan `Europe/Istanbul`). Geçersizse "—". */
export function formatTime(
  value: FormattableDate | null | undefined,
  options: DateTimeFormatOptions = {},
): string {
  const date = toDate(value);
  if (!date) {
    return EMPTY_VALUE;
  }
  const formatter = getDateFormatter(options.locale ?? defaultLocale, {
    timeStyle: "short",
    timeZone: options.timeZone ?? MARKET_TIME_ZONE,
  });
  return formatter.format(date);
}

type WithoutLocale<T> = Omit<T, "locale">;

/** Aktif locale bağlanmış biçimlendirici seti. */
export type Formatters = {
  locale: Locale;
  formatPrice: (value: number | null | undefined, options?: WithoutLocale<PriceFormatOptions>) => string;
  formatChangeValue: (
    value: number | null | undefined,
    options?: WithoutLocale<ChangeFormatOptions>,
  ) => string;
  formatChangePercent: (
    value: number | null | undefined,
    options?: WithoutLocale<ChangeFormatOptions>,
  ) => string;
  formatCompactNumber: (
    value: number | null | undefined,
    options?: WithoutLocale<ChangeFormatOptions>,
  ) => string;
  formatDateTime: (
    value: FormattableDate | null | undefined,
    options?: WithoutLocale<DateTimeFormatOptions>,
  ) => string;
  formatDate: (
    value: FormattableDate | null | undefined,
    options?: WithoutLocale<DateFormatOptions>,
  ) => string;
  formatTime: (
    value: FormattableDate | null | undefined,
    options?: WithoutLocale<DateTimeFormatOptions>,
  ) => string;
};

/**
 * Bileşenler için aktif locale'e bağlı biçimlendiriciler.
 *
 * Kanca (hook) olduğu için yalnız istemci bileşenlerinde çağrılır; sunucu
 * tarafı saf fonksiyonları locale argümanıyla kullanır.
 */
export function useFormatters(): Formatters {
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return useMemo(
    () => ({
      locale,
      formatPrice: (value, options) => formatPrice(value, { locale, ...options }),
      formatChangeValue: (value, options) => formatChangeValue(value, { locale, ...options }),
      formatChangePercent: (value, options) =>
        formatChangePercent(value, { locale, ...options }),
      formatCompactNumber: (value, options) =>
        formatCompactNumber(value, { locale, ...options }),
      formatDateTime: (value, options) => formatDateTime(value, { locale, ...options }),
      formatDate: (value, options) => formatDate(value, { locale, ...options }),
      formatTime: (value, options) => formatTime(value, { locale, ...options }),
    }),
    [locale],
  );
}
