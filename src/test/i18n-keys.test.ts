/**
 * Çeviri kataloğu kapısı (plan S-18).
 *
 * `messages/*.json` dosyalarının anahtar setleri birebir aynı olmalı; boş
 * değer veya string dışı yaprak bulunmamalı. Eksik/artık anahtar bu testle
 * yakalanır; katalog dosyaları gerçek kaynaktır.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { locales } from "@/i18n/config";

const MESSAGES_DIR = join(import.meta.dirname, "..", "..", "messages");

type MessageTree = Record<string, unknown>;

function loadMessages(locale: string): MessageTree {
  const raw = readFileSync(join(MESSAGES_DIR, `${locale}.json`), "utf8");
  return JSON.parse(raw) as MessageTree;
}

function isMessageTree(value: unknown): value is MessageTree {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** İç içe ağacı `anahtar.yolu` → yaprak değer çiftlerine düzler. */
function leafEntries(tree: MessageTree, prefix = ""): Array<[string, unknown]> {
  const entries: Array<[string, unknown]> = [];
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix === "" ? key : `${prefix}.${key}`;
    if (isMessageTree(value)) {
      entries.push(...leafEntries(value, path));
    } else {
      entries.push([path, value]);
    }
  }
  return entries;
}

const catalogs = locales.map((locale) => [locale, loadMessages(locale)] as const);

describe("çeviri katalogları", () => {
  it("tüm dillerde anahtar setleri birebir aynı", () => {
    const [referenceLocale, referenceCatalog] = catalogs[0];
    const referenceKeys = leafEntries(referenceCatalog)
      .map(([key]) => key)
      .sort();

    expect(referenceKeys.length).toBeGreaterThan(0);

    for (const [locale, catalog] of catalogs) {
      const keys = leafEntries(catalog)
        .map(([key]) => key)
        .sort();
      expect(keys, `${locale} anahtarları ${referenceLocale} ile eşleşmeli`).toEqual(referenceKeys);
    }
  });

  it("boş değer veya string dışı yaprak yok", () => {
    for (const [locale, catalog] of catalogs) {
      for (const [key, value] of leafEntries(catalog)) {
        expect(typeof value, `${locale}:${key} string olmalı`).toBe("string");
        expect(String(value).trim(), `${locale}:${key} boş olmamalı`).not.toBe("");
      }
    }
  });
});
