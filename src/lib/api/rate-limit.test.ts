/**
 * 429 / `Retry-After` yardımcı testleri (Faz 5C / X-07, S-11).
 */
import { describe, expect, it } from "vitest";

import { collectRateLimit, parseRetryAfter } from "@/lib/api/rate-limit";

describe("parseRetryAfter", () => {
  it("delta-saniyeyi çözer", () => {
    expect(parseRetryAfter("30")).toBe(30);
    expect(parseRetryAfter(" 0 ")).toBe(0);
  });

  it("HTTP tarihini saniyeye çevirir", () => {
    const future = new Date(Date.now() + 10_000).toUTCString();
    const parsed = parseRetryAfter(future);
    expect(parsed).not.toBeNull();
    expect(parsed!).toBeGreaterThanOrEqual(9);
    expect(parsed!).toBeLessThanOrEqual(11);
  });

  it("geçersiz/boş değerde null döner", () => {
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter("")).toBeNull();
    expect(parseRetryAfter("çok yakında")).toBeNull();
  });
});

describe("collectRateLimit", () => {
  it("hiç 429 yoksa limited false", () => {
    expect(
      collectRateLimit([
        { status: 200, retryAfter: null },
        { status: 404, retryAfter: null },
      ]),
    ).toEqual({ limited: false, retryAfter: null });
  });

  it("429 varsa en büyük Retry-After seçilir", () => {
    expect(
      collectRateLimit([
        { status: 429, retryAfter: 5 },
        { status: 200, retryAfter: null },
        { status: 429, retryAfter: 30 },
      ]),
    ).toEqual({ limited: true, retryAfter: 30 });
  });

  it("429 ama başlık yoksa süre null kalır", () => {
    expect(collectRateLimit([{ status: 429, retryAfter: null }])).toEqual({
      limited: true,
      retryAfter: null,
    });
  });
});
