/**
 * Dil ve tema çözümleyicilerinin birim testleri (plan M-08, M-09).
 *
 * `src/i18n/config.ts` yan etkisizdir; çerez/başlık girdileri doğrudan
 * verilebilir. Öncelik sırası: `NEXT_LOCALE` → `Accept-Language` → `tr`.
 */
import { describe, expect, it } from "vitest";

import { defaultLocale, defaultTheme, resolveLocale, resolveTheme } from "@/i18n/config";

describe("resolveLocale", () => {
  it("geçerli çerez, Accept-Language başlığını geçersiz kılar", () => {
    expect(resolveLocale("en", "tr-TR,tr;q=0.9,en;q=0.8")).toBe("en");
    expect(resolveLocale("tr", "en-US,en;q=0.9")).toBe("tr");
  });

  it("Accept-Language: tr-TR,tr;q=0.9,en;q=0.8 → tr", () => {
    expect(resolveLocale(undefined, "tr-TR,tr;q=0.9,en;q=0.8")).toBe("tr");
  });

  it("Accept-Language: en-US,en;q=0.9 → en", () => {
    expect(resolveLocale(undefined, "en-US,en;q=0.9")).toBe("en");
  });

  it("q değerlerine göre azalan öncelikle seçer", () => {
    expect(resolveLocale(undefined, "en;q=0.4,tr;q=0.9")).toBe("tr");
    expect(resolveLocale(undefined, "tr;q=0.2,en;q=0.8")).toBe("en");
    expect(resolveLocale(undefined, "en;q=0,tr;q=0.5")).toBe("tr");
  });

  it("boş ve geçersiz girdilerde varsayılana döner", () => {
    expect(resolveLocale(undefined, undefined)).toBe(defaultLocale);
    expect(resolveLocale("", "")).toBe(defaultLocale);
    expect(resolveLocale("xx", undefined)).toBe(defaultLocale);
    expect(resolveLocale(undefined, "de-DE,de;q=0.9")).toBe(defaultLocale);
    expect(resolveLocale(undefined, "*")).toBe(defaultLocale);
    expect(resolveLocale("EN", "de-DE")).toBe(defaultLocale);
  });

  it("geçersiz çerez yok sayılır, başlık devreye girer", () => {
    expect(resolveLocale("EN", "en-US")).toBe("en");
    expect(resolveLocale("", "tr-TR")).toBe("tr");
  });
});

describe("resolveTheme", () => {
  it("üç tema değerini kabul eder", () => {
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("sepia")).toBe("sepia");
  });

  it("geçersiz/eksik değerde varsayılana döner", () => {
    expect(resolveTheme("neon")).toBe(defaultTheme);
    expect(resolveTheme("")).toBe(defaultTheme);
    expect(resolveTheme(undefined)).toBe(defaultTheme);
    expect(resolveTheme("DARK")).toBe(defaultTheme);
  });
});
