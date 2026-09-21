"use server";

/**
 * Kullanıcı tercihlerini yazan server action'lar (plan M-08, M-09).
 *
 * Değerler ağ sınırından geldiği için yeniden doğrulanır; geçersiz değer
 * sessizce yazılmaz. Çerezler `path=/` ve 1 yıl ömürle yazılır; ardından kök
 * layout yeniden doğrulanır (dil/tema `<html>` niteliklerini besler).
 */
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { isLocale, isTheme, LOCALE_COOKIE, THEME_COOKIE } from "./config";
import type { Locale, ThemeName } from "./config";

/** 1 yıl (saniye). */
const PREFERENCE_MAX_AGE = 60 * 60 * 24 * 365;

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: PREFERENCE_MAX_AGE,
  sameSite: "lax",
} as const;

export async function setLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) {
    throw new Error("Invalid locale");
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, COOKIE_OPTIONS);
  revalidatePath("/", "layout");
}

export async function setTheme(theme: ThemeName): Promise<void> {
  if (!isTheme(theme)) {
    throw new Error("Invalid theme");
  }

  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, theme, COOKIE_OPTIONS);
  revalidatePath("/", "layout");
}
