/**
 * Bülten yardımcıları testleri (Faz 5 / Birim 5A.3, U-08, S-15).
 *
 * Tarih/slot doğrulama, İstanbul günü, gün kaydırma, bağlantı kurma ve
 * tazelik kararı doğrulanır. Tazelik kararı backend'in pencere yanıtına
 * dayanır; uydurma slot sınırı yoktur.
 */
import { describe, expect, it } from "vitest";

import {
  digestHref,
  firstParam,
  isDigestSlot,
  isIsoDate,
  resolveDigestFreshness,
  shiftIsoDate,
  todayInIstanbul,
} from "@/lib/digest/digest";
import type { Digest } from "@/lib/digest/types";

function digest(overrides: Partial<Digest> = {}): Digest {
  return {
    id: "abc",
    date: "2026-09-01",
    slot: "morning",
    title: "Bülten",
    content: "içerik",
    sections: [],
    metadata: {},
    language: "tr",
    created_at: "2026-09-01T07:00:00Z",
    ...overrides,
  };
}

describe("isIsoDate", () => {
  it("gerçek takvim günlerini kabul eder", () => {
    expect(isIsoDate("2026-09-01")).toBe(true);
    expect(isIsoDate("2026-02-28")).toBe(true);
  });

  it("bozuk veya var olmayan tarihleri reddeder", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-9-1")).toBe(false);
    expect(isIsoDate("01-09-2026")).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });
});

describe("isDigestSlot", () => {
  it("bilinen slotları kabul, diğerlerini reddeder", () => {
    expect(isDigestSlot("noon")).toBe(true);
    expect(isDigestSlot("midnight")).toBe(false);
    expect(isDigestSlot(undefined)).toBe(false);
  });
});

describe("shiftIsoDate", () => {
  it("ay ve yıl sınırlarını doğru geçer", () => {
    expect(shiftIsoDate("2026-09-01", -1)).toBe("2026-08-31");
    expect(shiftIsoDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftIsoDate("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("todayInIstanbul", () => {
  it("UTC gece yarısından sonra İstanbul gününe geçer", () => {
    expect(todayInIstanbul(new Date("2026-09-01T22:30:00Z"))).toBe("2026-09-02");
    expect(todayInIstanbul(new Date("2026-09-01T20:00:00Z"))).toBe("2026-09-01");
  });
});

describe("resolveDigestFreshness", () => {
  it("pencere bülteni güncel bültenle aynıysa taze", () => {
    expect(
      resolveDigestFreshness(digest(), { status: 200, data: digest() }),
    ).toBe("current");
  });

  it("pencere 404 ise bayat", () => {
    expect(resolveDigestFreshness(digest(), { status: 404, data: null })).toBe("stale");
  });

  it("farklı bülten dönerse bayat", () => {
    expect(
      resolveDigestFreshness(digest(), { status: 200, data: digest({ id: "other" }) }),
    ).toBe("stale");
  });

  it("ağ/sunucu hatasında karar bilinemez", () => {
    expect(resolveDigestFreshness(digest(), { status: 0, data: null })).toBe("unknown");
    expect(resolveDigestFreshness(digest(), { status: 500, data: null })).toBe("unknown");
  });
});

describe("digestHref", () => {
  it("tarihi her zaman taşır, slotu opsiyonel ekler", () => {
    expect(digestHref("2026-09-01")).toBe("/digest?date=2026-09-01");
    expect(digestHref("2026-09-01", "evening")).toBe(
      "/digest?date=2026-09-01&slot=evening",
    );
  });
});

describe("firstParam", () => {
  it("dizinin ilk öğesini alır", () => {
    expect(firstParam(["a", "b"])).toBe("a");
    expect(firstParam(undefined)).toBeUndefined();
  });
});
