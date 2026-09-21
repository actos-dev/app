/**
 * Kontrast kapısı (plan §3.2 / ADR 0002).
 *
 * Tema CSS'inden efektif token setleri okunur ve WCAG 2.x oranı hesaplanır:
 *  - metin çiftleri ≥ 4,5
 *  - metin olmayan UI çiftleri ≥ 3,0
 *
 * Eşikler düşürülmez; palet eşiği geçecek şekilde rafine edilir.
 */
import { describe, expect, it } from "vitest";

import {
  REQUIRED_ROLES,
  THEME_NAMES,
  contrastRatio,
  isOpaqueHex,
  loadOverrideVars,
  loadThemeMappings,
  loadThemeVars,
  parseHex,
  resolveToken,
  type Role,
  type ThemeName,
} from "./contrast-utils";

type ContrastPair = readonly [Role, Role];

const MIN_TEXT_CONTRAST = 4.5;
const MIN_UI_CONTRAST = 3;

/** Gövde metni ve `*-foreground` çiftleri. */
const TEXT_PAIRS: readonly ContrastPair[] = [
  ["foreground", "background"],
  ["foreground", "surface"],
  ["surface-foreground", "surface"],
  ["muted-foreground", "background"],
  ["muted-foreground", "surface"],
  ["primary-foreground", "primary"],
  ["accent-foreground", "accent"],
  ["positive-foreground", "positive"],
  ["negative-foreground", "negative"],
  ["warning-foreground", "warning"],
  ["info-foreground", "info"],
];

/** Metin olmayan UI/görsel çiftleri. */
const UI_PAIRS: readonly ContrastPair[] = [
  ["focus-ring", "background"],
  ["chart-up", "background"],
  ["chart-down", "background"],
  ["chart-text", "background"],
];

const THEME_VARS = {
  dark: loadThemeVars("dark"),
  light: loadThemeVars("light"),
  sepia: loadThemeVars("sepia"),
} satisfies Record<ThemeName, Record<string, string>>;

function ratioFor(theme: ThemeName, [foreground, background]: ContrastPair): number {
  const vars = THEME_VARS[theme];
  return contrastRatio(
    parseHex(resolveToken(vars, foreground)),
    parseHex(resolveToken(vars, background)),
  );
}

const MEASUREMENTS = THEME_NAMES.flatMap((theme) =>
  [
    ...TEXT_PAIRS.map((pair) => ({ pair, minimum: MIN_TEXT_CONTRAST })),
    ...UI_PAIRS.map((pair) => ({ pair, minimum: MIN_UI_CONTRAST })),
  ].map(({ pair, minimum }) => {
    const [foreground, background] = pair;
    const ratio = ratioFor(theme, pair);
    return {
      theme,
      pair: `${foreground} / ${background}`,
      ratio,
      minimum,
      passed: ratio >= minimum,
    };
  }),
);

describe("kontrast kapısı — metin çiftleri (≥ 4,5)", () => {
  for (const pair of TEXT_PAIRS) {
    it(`${pair[0]} / ${pair[1]}`, () => {
      for (const theme of THEME_NAMES) {
        const ratio = ratioFor(theme, pair);
        expect(
          ratio,
          `${theme}: ${pair[0]}/${pair[1]} = ${ratio.toFixed(2)}; gereken ≥ ${MIN_TEXT_CONTRAST}`,
        ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
      }
    });
  }
});

describe("kontrast kapısı — UI çiftleri (≥ 3,0)", () => {
  for (const pair of UI_PAIRS) {
    it(`${pair[0]} / ${pair[1]}`, () => {
      for (const theme of THEME_NAMES) {
        const ratio = ratioFor(theme, pair);
        expect(
          ratio,
          `${theme}: ${pair[0]}/${pair[1]} = ${ratio.toFixed(2)}; gereken ≥ ${MIN_UI_CONTRAST}`,
        ).toBeGreaterThanOrEqual(MIN_UI_CONTRAST);
      }
    });
  }
});

describe("token bütünlüğü", () => {
  it("tema × çift tablosunu üretir", () => {
    console.table(
      MEASUREMENTS.map(({ theme, pair, ratio, minimum, passed }) => ({
        theme,
        pair,
        ratio: ratio.toFixed(2),
        minimum,
        result: passed ? "OK" : "FAIL",
      })),
    );
    expect(MEASUREMENTS.every((measurement) => measurement.passed)).toBe(true);
  });

  it("her tema tüm zorunlu rolleri tanımlar", () => {
    for (const theme of THEME_NAMES) {
      const missing = REQUIRED_ROLES.filter((role) => !(role in THEME_VARS[theme]));
      expect(missing, `${theme} temasında eksik roller`).toEqual([]);
    }
  });

  it("light ve sepia tüm rolleri açıkça override eder (koyu sızıntısı yok)", () => {
    for (const theme of ["light", "sepia"] as const) {
      const overrides = loadOverrideVars(theme);
      const missing = REQUIRED_ROLES.filter((role) => !(role in overrides));
      expect(missing, `${theme} override dosyasında eksik roller`).toEqual([]);
    }
  });

  it("@theme inline her rolü --color-* utility'sine bağlar", () => {
    const mappings = loadThemeMappings();
    for (const role of REQUIRED_ROLES) {
      expect(mappings[`color-${role}`], `--color-${role} eşlemesi eksik veya yanlış`).toBe(
        `var(--${role})`,
      );
    }
  });

  it("renk rolleri opak HEX (overlay hariç)", () => {
    for (const theme of THEME_NAMES) {
      for (const role of REQUIRED_ROLES) {
        if (role === "overlay") continue;
        const value = resolveToken(THEME_VARS[theme], role);
        expect(isOpaqueHex(value), `${theme}: --${role} = ${value}; opak HEX olmalı`).toBe(true);
      }
    }
  });

  it("geometri, gölge ve tipografi token'ları tanımlı", () => {
    expect(THEME_VARS.dark.radius).toBe("0.5rem");
    const mappings = loadThemeMappings();
    expect(mappings["shadow-panel"]).toBeTruthy();
    expect(mappings["shadow-pop"]).toBeTruthy();
    expect(mappings["font-sans"]).toBe("var(--font-geist-sans)");
    expect(mappings["font-mono"]).toBe("var(--font-geist-mono)");
  });
});
