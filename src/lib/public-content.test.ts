/**
 * Public içerik ayrıştırma testleri (Faz 2 / Birim 2.3b).
 *
 * Backend gövdeleri `unknown` geldiğinden ayrıştırıcıların bozuk/eksik
 * değerlerde çökmeden makul sonuç üretmesi beklenir.
 */
import { describe, expect, it } from "vitest";

import {
  isLegalPolicy,
  LEGAL_POLICIES,
  parseAboutResponse,
  parseContactResponse,
  parseLegalResponse,
  parseVersionResponse,
  splitLegalContent,
  splitParagraphs,
} from "@/lib/public-content";

describe("isLegalPolicy", () => {
  it("backend allowlist'ini kabul eder, diğerlerini reddeder", () => {
    for (const policy of LEGAL_POLICIES) {
      expect(isLegalPolicy(policy)).toBe(true);
    }
    expect(isLegalPolicy("unknown-policy")).toBe(false);
    expect(isLegalPolicy("")).toBe(false);
  });
});

describe("splitParagraphs", () => {
  it("boş satırlardan paragraf ayırır ve satır sonlarını birleştirir", () => {
    const result = splitParagraphs("Birinci satır,\nikinci satır.\n\nİkinci paragraf.  \n\n");
    expect(result).toEqual(["Birinci satır, ikinci satır.", "İkinci paragraf."]);
  });

  it("boş metinde boş dizi döner", () => {
    expect(splitParagraphs("   \n\n  ")).toEqual([]);
  });
});

describe("splitLegalContent", () => {
  it("paragraf ve madde listesi bloklarını ayırır", () => {
    const blocks = splitLegalContent("Başlık\n\n* Bir\n* İki\n\nKapanış");
    expect(blocks).toEqual([
      { type: "paragraph", text: "Başlık" },
      { type: "list", items: ["Bir", "İki"] },
      { type: "paragraph", text: "Kapanış" },
    ]);
  });
});

describe("parseAboutResponse", () => {
  it("lang ve paragrafları çıkarır", () => {
    expect(parseAboutResponse({ lang: "tr", content: "A\n\nB" })).toEqual({
      lang: "tr",
      paragraphs: ["A", "B"],
    });
  });

  it("nesne olmayan ve eksik gövdede dayanıklıdır", () => {
    expect(parseAboutResponse(null)).toBeNull();
    expect(parseAboutResponse("metin")).toBeNull();
    expect(parseAboutResponse({})).toEqual({ lang: null, paragraphs: [] });
  });
});

describe("parseContactResponse", () => {
  it("email ve github alanlarını çıkarır", () => {
    expect(parseContactResponse({ email: "a@b.c", github: "https://example.com" })).toEqual({
      email: "a@b.c",
      github: "https://example.com",
    });
  });

  it("eksik alanlarda null döner", () => {
    expect(parseContactResponse({ email: "" })).toEqual({ email: null, github: null });
    expect(parseContactResponse(undefined)).toBeNull();
  });
});

describe("parseLegalResponse", () => {
  it("last_updated ve blokları çıkarır", () => {
    expect(
      parseLegalResponse({
        policy: "terms",
        lang: "tr",
        last_updated: "2026-07-22",
        content: "Metin",
      }),
    ).toEqual({
      policy: "terms",
      lang: "tr",
      lastUpdated: "2026-07-22",
      blocks: [{ type: "paragraph", text: "Metin" }],
    });
  });

  it("sayısal last_updated'ı yok sayar", () => {
    expect(parseLegalResponse({ last_updated: 20260722 })?.lastUpdated).toBeNull();
  });
});

describe("parseVersionResponse", () => {
  it("version string'ini çıkarır, boş/eksikte null döner", () => {
    expect(parseVersionResponse({ version: "0.6.0" })).toBe("0.6.0");
    expect(parseVersionResponse({ version: "  " })).toBeNull();
    expect(parseVersionResponse({})).toBeNull();
    expect(parseVersionResponse(null)).toBeNull();
  });
});
