/**
 * Çerez rızası testleri (plan S-04).
 *
 * Varsayılan kapalı, geçersiz değerde kapalı, set/get turu ve ham çerez
 * ayrıştırma doğrulanır.
 */
import { afterEach, describe, expect, it } from "vitest";

import {
  CONSENT_COOKIE,
  DEFAULT_CONSENT,
  getConsent,
  hasAnalyticsConsent,
  parseConsent,
  readCookieValue,
  serializeConsent,
  setConsent,
} from "@/lib/consent";

afterEach(() => {
  // Testler arası çerez sızmasını önle.
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0`;
});

describe("parseConsent", () => {
  it("çerez yokken kapalı döner", () => {
    expect(parseConsent(undefined)).toEqual(DEFAULT_CONSENT);
    expect(parseConsent(null)).toEqual(DEFAULT_CONSENT);
    expect(parseConsent("")).toEqual(DEFAULT_CONSENT);
  });

  it("yalnızca boolean true açık rıza sayılır", () => {
    expect(parseConsent(serializeConsent({ analytics: true }))).toEqual({ analytics: true });
    expect(parseConsent('{"analytics":false}')).toEqual({ analytics: false });
    expect(parseConsent('{"analytics":"true"}')).toEqual({ analytics: false });
  });

  it("geçersiz/biçimsiz değerde kapalı döner", () => {
    expect(parseConsent("garbage")).toEqual(DEFAULT_CONSENT);
    expect(parseConsent("{")).toEqual(DEFAULT_CONSENT);
    expect(parseConsent("[1,2,3]")).toEqual(DEFAULT_CONSENT);
    expect(parseConsent("42")).toEqual(DEFAULT_CONSENT);
  });
});

describe("serializeConsent", () => {
  it("sürümlü JSON üretir ve turu korur", () => {
    const raw = serializeConsent({ analytics: true });
    expect(JSON.parse(raw)).toEqual({ v: 1, analytics: true });
    expect(parseConsent(raw).analytics).toBe(true);
  });
});

describe("readCookieValue", () => {
  it("istenen anahtarı bulup decode eder", () => {
    const header = `a=1; ${CONSENT_COOKIE}=${encodeURIComponent('{"analytics":true}')}; b=2`;
    expect(readCookieValue(header, CONSENT_COOKIE)).toBe('{"analytics":true}');
    expect(readCookieValue(header, "missing")).toBeUndefined();
  });
});

describe("getConsent / setConsent", () => {
  it("başlangıçta kapalı; setConsent sonrası açılır", () => {
    expect(hasAnalyticsConsent()).toBe(false);
    setConsent({ analytics: true });
    expect(getConsent()).toEqual({ analytics: true });
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("rıza kapatılabilir", () => {
    setConsent({ analytics: true });
    setConsent({ analytics: false });
    expect(hasAnalyticsConsent()).toBe(false);
  });
});
