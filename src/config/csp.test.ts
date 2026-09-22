/**
 * CSP kurucusu testleri (plan S-05, Faz 6).
 *
 * Nonce ve `strict-dynamic` üretimde mevcut olmalı; `'unsafe-eval'` yalnız
 * geliştirmede eklenmeli. `style-src` bilinçli olarak nonce içermez.
 */
import { describe, expect, it } from "vitest";

import { buildCsp, CSP_HEADER, generateNonce, NONCE_HEADER, NONCE_PATTERN } from "@/config/csp";

describe("buildCsp", () => {
  it("nonce'ı script-src'e ve strict-dynamic'i ekler", () => {
    const csp = buildCsp("abc123", false);

    expect(csp).toContain("'nonce-abc123'");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("style-src'te nonce yerine unsafe-inline bırakır (inline style kırılmasın)", () => {
    const csp = buildCsp("n1", false);
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain(`style-src 'self' '${NONCE_PATTERN}n1'`);
  });

  it("geliştirmede unsafe-eval ekler", () => {
    expect(buildCsp("n1", true)).toContain("'unsafe-eval'");
    expect(buildCsp("n1", false)).not.toContain("'unsafe-eval'");
  });

  it("savunma direktiflerini içerir", () => {
    const csp = buildCsp("n1", false);
    for (const directive of [
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "worker-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ]) {
      expect(csp).toContain(directive);
    }
  });
});

describe("generateNonce", () => {
  it("boş değil ve her çağrıda farklı", () => {
    const first = generateNonce();
    const second = generateNonce();
    expect(first.length).toBeGreaterThan(0);
    expect(first).not.toBe(second);
  });
});

describe("başlık sabitleri", () => {
  it("Next'in beklediği değerleri taşır", () => {
    expect(CSP_HEADER).toBe("Content-Security-Policy");
    expect(NONCE_HEADER).toBe("x-nonce");
    expect(NONCE_PATTERN).toBe("nonce-");
  });
});
