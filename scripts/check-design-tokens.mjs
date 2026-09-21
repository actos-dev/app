#!/usr/bin/env node
/**
 * Tasarım token kapısı.
 *
 * `src/**` altındaki .ts/.tsx/.css dosyalarını tarar ve şu ihlalleri raporlar:
 *   1. 12px altı keyfi font boyutu   → `text-[10px]`, `text-[11px]` (token kullanılmalı)
 *   2. Keyfi renk utility'si         → `bg-[#0b0e14]`, `text-[#fff]` (token kullanılmalı)
 *   3. `!` prefix'li utility        → `!text-sm`, `hover:!text-muted` (Tailwind öncelik hack'i)
 *
 * .ts/.tsx dosyalarında kurallar yalnız string literal içinde aranır; böylece
 * `!` operatörü veya yorum satırları yanlış pozitif üretmez. .css dosyalarında
 * 1 ve 2 numaralı kurallar ham metinde aranır (3 numaralı kural Tailwind'e özgüdür,
 * düz CSS'te `!important` olarak geçebileceği için CSS'te uygulanmaz).
 *
 * Muafiyetler: `src/types/generated.ts` (üretilmiş dosya) ve `openapi.json` (şema).
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = join(ROOT, "src");
const SCANNED_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);
const EXEMPT_FILES = new Set([join("src", "types", "generated.ts")]);

const RULES = {
  arbitraryFontSize: /text-\[(\d{1,2})px\]/g,
  arbitraryColor: /(?:bg|text|border|ring|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/g,
  forcedUtility: /![a-zA-Z][\w./%[\]()-]*/g,
};

/** Dizini özyinelemeli gezer; taranacak uzantıdaki dosya yollarını döner. */
async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (SCANNED_EXTENSIONS.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

/** Bir satırdan string literal içeriklerini çıkarır (TS/TSX için). */
function extractStringLiterals(line) {
  const matches = line.match(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\\n]|\\.)*`/g);
  return matches ? matches.join(" ") : "";
}

/** Tek bir satırda üç kuralı uygular; bulguları döner. */
function inspectLine(line, { isCss }) {
  const haystack = isCss ? line : extractStringLiterals(line);
  const findings = [];

  for (const match of haystack.matchAll(RULES.arbitraryFontSize)) {
    if (Number(match[1]) < 12) {
      findings.push(`keyfi font boyutu (12px altı): ${match[0]}`);
    }
  }
  for (const match of haystack.matchAll(RULES.arbitraryColor)) {
    findings.push(`keyfi renk utility'si: ${match[0]}`);
  }
  if (!isCss) {
    for (const match of haystack.matchAll(RULES.forcedUtility)) {
      const token = match[0].trim();
      if (token !== "!important") {
        findings.push(`! prefix'li utility: ${token}`);
      }
    }
  }
  return findings;
}

async function main() {
  const files = (await collectFiles(SRC_DIR)).sort();
  const violations = [];
  let scannedLines = 0;

  for (const file of files) {
    const relativePath = relative(ROOT, file);
    if (EXEMPT_FILES.has(relativePath)) continue;

    const isCss = extname(file) === ".css";
    const lines = (await readFile(file, "utf8")).split("\n");
    scannedLines += lines.length;

    lines.forEach((line, index) => {
      for (const finding of inspectLine(line, { isCss })) {
        violations.push({ file: relativePath, line: index + 1, finding });
      }
    });
  }

  if (violations.length > 0) {
    console.error(`[check:tokens] ${violations.length} ihlal bulundu:\n`);
    for (const { file, line, finding } of violations) {
      console.error(`  ${file}:${line}  ${finding}`);
    }
    console.error("\n[check:tokens] Tasarım token'ları kullanın; keyfi değer ve ! prefix yasak.");
    process.exit(1);
  }

  console.log(
    `[check:tokens] Temiz: ${files.length} dosya, ${scannedLines} satır tarandı; ihlal yok.`,
  );
}

main().catch((error) => {
  console.error(`[check:tokens] HATA: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
