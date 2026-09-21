/**
 * Rapor yardımcı testleri (Faz 5 / Birim 5A.1, U-09).
 */
import { describe, expect, it } from "vitest";

import {
  isReportType,
  normalizePurpose,
  PURPOSE_MAX_LENGTH,
  reportHref,
  sentimentLabelKey,
  sentimentVariant,
} from "@/lib/reports/report";

describe("isReportType", () => {
  it("yalnız backend allowlist'ini kabul eder", () => {
    expect(isReportType("quick_report")).toBe(true);
    expect(isReportType("deep_report")).toBe(true);
    expect(isReportType("other")).toBe(false);
    expect(isReportType(null)).toBe(false);
  });
});

describe("normalizePurpose", () => {
  it("boş/yalnız boşluk girdiyi göndermez", () => {
    expect(normalizePurpose("")).toBeNull();
    expect(normalizePurpose("   ")).toBeNull();
  });

  it("kırpar ve sınırı aşanı reddeder", () => {
    expect(normalizePurpose("  temettü  ")).toBe("temettü");
    expect(normalizePurpose("a".repeat(PURPOSE_MAX_LENGTH))).toHaveLength(PURPOSE_MAX_LENGTH);
    expect(normalizePurpose("a".repeat(PURPOSE_MAX_LENGTH + 1))).toBeNull();
  });
});

describe("sentiment eşlemesi", () => {
  it("varyant ve etiket anahtarı üretir", () => {
    expect(sentimentVariant("positive")).toBe("positive");
    expect(sentimentVariant("NEGATIVE")).toBe("negative");
    expect(sentimentVariant("belirsiz")).toBe("neutral");
    expect(sentimentLabelKey(undefined)).toBe("neutral");
  });
});

describe("reportHref", () => {
  it("detay yolunu üretir", () => {
    expect(reportHref(42)).toBe("/research/reports/42");
  });
});
