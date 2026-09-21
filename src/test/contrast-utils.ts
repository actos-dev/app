/**
 * Kontrast kapısı yardımcıları.
 *
 * Tema CSS dosyalarından `:root` ve `:root[data-theme="..."]` bloklarını parse
 * eder, WCAG 2.x relative luminance ve kontrast oranını hesaplar. Test dosyası
 * (`contrast.test.ts`) bu yardımcıları kullanarak tema × rol çiftlerini doğrular.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Semantik roller — her temada hem `--rol` değişkeni hem `--color-rol` eşlemesi olmalı. */
export const REQUIRED_ROLES = [
  "background",
  "foreground",
  "surface",
  "surface-foreground",
  "surface-raised",
  "surface-hover",
  "border",
  "border-strong",
  "muted-foreground",
  "primary",
  "primary-foreground",
  "primary-hover",
  "accent",
  "accent-foreground",
  "positive",
  "positive-foreground",
  "negative",
  "negative-foreground",
  "warning",
  "warning-foreground",
  "info",
  "info-foreground",
  "focus-ring",
  "overlay",
  "chart-up",
  "chart-down",
  "chart-grid",
  "chart-text",
] as const;

export type Role = (typeof REQUIRED_ROLES)[number];
export type ThemeName = "dark" | "light" | "sepia";

export const THEME_NAMES: readonly ThemeName[] = ["dark", "light", "sepia"];

/** `:root` dışındaki tema dosyaları ve blok seçicileri. */
const THEME_OVERRIDES: Record<Exclude<ThemeName, "dark">, { file: string; selector: string }> = {
  light: { file: "themes/light.css", selector: ':root[data-theme="light"]' },
  sepia: { file: "themes/sepia.css", selector: ':root[data-theme="sepia"]' },
};

/** `src/styles/` kökü — Vitest/Vite dönüşümünden etkilenmeyen dosya yolu. */
const STYLES_DIR = join(import.meta.dirname, "..", "styles");

function readStylesFile(relativePath: string): string {
  return readFileSync(join(STYLES_DIR, relativePath), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Verilen seçiciye ait bloğun içindeki `--token: değer` bildirimlerini döner. */
export function parseBlock(css: string, selector: string): Record<string, string> {
  const source = stripComments(css);
  const match = new RegExp(`${escapeRegExp(selector)}\\s*\\{`).exec(source);
  if (!match) {
    throw new Error(`CSS bloğu bulunamadı: ${selector}`);
  }
  const open = source.indexOf("{", match.index);
  const close = source.indexOf("}", open);
  const block = source.slice(open + 1, close);
  const vars: Record<string, string> = {};
  for (const declaration of block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    vars[declaration[1]] = declaration[2].trim();
  }
  return vars;
}

/** Tema dosyasındaki override setini (koyu `:root` hariç) döner. */
export function loadOverrideVars(theme: Exclude<ThemeName, "dark">): Record<string, string> {
  const { file, selector } = THEME_OVERRIDES[theme];
  return parseBlock(readStylesFile(file), selector);
}

/** Efektif token setini döner: `:root` (koyu) + tema override'ı. */
export function loadThemeVars(theme: ThemeName): Record<string, string> {
  const vars = parseBlock(readStylesFile("tokens.css"), ":root");
  if (theme !== "dark") {
    Object.assign(vars, loadOverrideVars(theme));
  }
  return vars;
}

/** `tokens.css` içindeki `@theme inline` eşlemelerini döner. */
export function loadThemeMappings(): Record<string, string> {
  return parseBlock(readStylesFile("tokens.css"), "@theme inline");
}

/** Bir rolün efektif değerini `var()` zincirini takip ederek çözer. */
export function resolveToken(vars: Record<string, string>, role: Role): string {
  const seen = new Set<string>();
  let current: string = role;
  for (;;) {
    if (seen.has(current)) {
      throw new Error(`Döngüsel token referansı: --${current}`);
    }
    seen.add(current);
    const value = vars[current];
    if (value === undefined) {
      throw new Error(`Eksik token: --${current}`);
    }
    const reference = /^var\(\s*--([\w-]+)\s*\)$/.exec(value);
    if (!reference) {
      return value;
    }
    current = reference[1];
  }
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const OPAQUE_HEX = /^#[0-9a-f]{6}$/i;
const ANY_HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Alfa içermeyen 6 haneli HEX mi? (Metin rollerinde zorunlu.) */
export function isOpaqueHex(value: string): boolean {
  return OPAQUE_HEX.test(value);
}

export function parseHex(value: string): Rgb {
  if (!ANY_HEX.test(value)) {
    throw new Error(`HEX renk bekleniyordu, bulunan: ${value}`);
  }
  const hex = value.slice(1).toLowerCase();
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : hex;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

export function contrastRatio(foreground: Rgb, background: Rgb): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
