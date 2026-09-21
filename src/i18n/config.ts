/**
 * i18n ve tema runtime sabitleri (plan M-08, M-09).
 *
 * Bu modül bilerek yan etkisizdir: `next/headers` gibi istek API'lerine
 * dokunmaz, yalnızca saf çözümleyiciler sunar. Böylece Vitest ile doğrudan
 * test edilebilir; çerez/başlık okuma `src/i18n/request.ts` ile
 * `src/app/layout.tsx` sorumluluğundadır.
 *
 * Dil kaynağı sırası: `NEXT_LOCALE` çerezi → `Accept-Language` başlığı →
 * varsayılan `tr`. Tema kaynağı: `theme` çerezi → varsayılan `dark`.
 */

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const THEME_COOKIE = "theme";

export const locales = ["tr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "tr";

export const themes = ["dark", "light", "sepia"] as const;
export type ThemeName = (typeof themes)[number];

export const defaultTheme: ThemeName = "dark";

/** `viewport.themeColor` haritası; her tema için sabit (plan M-08). */
export const themeColors: Record<ThemeName, string> = {
  dark: "#0b0e14",
  light: "#f7f8fa",
  sepia: "#f4ecd8",
};

export function isLocale(value: string | undefined): value is Locale {
  return locales.some((locale) => locale === value);
}

export function isTheme(value: string | undefined): value is ThemeName {
  return themes.some((theme) => theme === value);
}

/**
 * `Accept-Language` başlığını q değerlerine göre azalan öncelikle çözer.
 * `*`, boş ve desteklenmeyen diller atlanır; eşleşme yoksa `undefined` döner.
 */
function localeFromAcceptLanguage(header: string): Locale | undefined {
  const candidates = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...parameters] = part.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const parsedQuality =
        qualityParameter === undefined
          ? 1
          : Number.parseFloat(qualityParameter.trim().slice(2));
      return {
        tag: tag.trim().toLowerCase(),
        quality: Number.isNaN(parsedQuality) ? 0 : parsedQuality,
        index,
      };
    })
    .filter((candidate) => candidate.tag !== "" && candidate.tag !== "*" && candidate.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const candidate of candidates) {
    const base = candidate.tag.split("-")[0];
    if (isLocale(base)) {
      return base;
    }
  }
  return undefined;
}

/** Dil çerezini ve başlığı sırayla dener; geçersiz girdilerde `tr` döner. */
export function resolveLocale(
  cookieValue: string | undefined,
  acceptLanguageHeader: string | undefined,
): Locale {
  if (isLocale(cookieValue)) {
    return cookieValue;
  }
  if (acceptLanguageHeader) {
    const fromHeader = localeFromAcceptLanguage(acceptLanguageHeader);
    if (fromHeader !== undefined) {
      return fromHeader;
    }
  }
  return defaultLocale;
}

/** Tema çerezini doğrular; geçersiz/eksik değerde `dark` döner. */
export function resolveTheme(cookieValue: string | undefined): ThemeName {
  return isTheme(cookieValue) ? cookieValue : defaultTheme;
}
