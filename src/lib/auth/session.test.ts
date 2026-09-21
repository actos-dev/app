/**
 * İmzasız JWT `exp` çözümü testleri (B-03 fallback).
 *
 * `session.ts` sunucu API'lerini (`next/headers`) içe aldığı için mock'lanır;
 * test edilen yardımcılar oradan re-export edilir (genel yüzey doğrulanır).
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import {
  getAccessTokenExpiry,
  isAccessTokenExpired,
} from "@/lib/auth/session";

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Elle üretilmiş, imzası önemsiz üç parçalı JWT. */
function makeToken(payload: Record<string, unknown>): string {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe("getAccessTokenExpiry", () => {
  it("geçerli payload'dan exp değerini döner", () => {
    const token = makeToken({ user_id: 1, iat: 1700000000, exp: 1700003600 });
    expect(getAccessTokenExpiry(token)).toBe(1700003600);
  });

  it("bozuk/eksik token'da null döner", () => {
    expect(getAccessTokenExpiry("not-a-jwt")).toBeNull();
    expect(getAccessTokenExpiry("a.b")).toBeNull();
    expect(getAccessTokenExpiry("a..c")).toBeNull();
    expect(getAccessTokenExpiry(makeToken({ user_id: 1 }))).toBeNull();
    expect(getAccessTokenExpiry(makeToken({ exp: "soon" }))).toBeNull();
  });

  it("bozuk base64/JSON'da null döner", () => {
    expect(getAccessTokenExpiry("aaa.###invalid###.ccc")).toBeNull();
  });
});

describe("isAccessTokenExpired", () => {
  it("süresi geçmiş token'ı süresi dolmuş sayar", () => {
    const token = makeToken({ exp: 1700000000 });
    expect(isAccessTokenExpired(token, 1700000000 * 1000 + 1)).toBe(true);
    expect(isAccessTokenExpired(token, 1700000000 * 1000 - 1)).toBe(false);
  });

  it("exp okunamayan token'ı süresi dolmuş sayar (güvenli taraf)", () => {
    expect(isAccessTokenExpired("garbage")).toBe(true);
  });
});
