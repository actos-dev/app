/**
 * `Set-Cookie` normalizasyonu testleri (refresh yardımcıları).
 */
import { describe, expect, it } from "vitest";

import { getSetCookieHeaders, normalizeSetCookies, parseSetCookie } from "@/lib/auth/refresh";

describe("parseSetCookie", () => {
  it("name/value ve nitelikleri çözer", () => {
    expect(
      parseSetCookie(
        "access_token=abc.def.ghi; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=strict",
      ),
    ).toEqual({
      name: "access_token",
      value: "abc.def.ghi",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 3600,
    });
  });

  it("refresh path'ini ve varsayılanları korur", () => {
    expect(parseSetCookie("refresh_token=rot; path=/api/v1/auth; HttpOnly")).toMatchObject({
      name: "refresh_token",
      value: "rot",
      path: "/api/v1/auth",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
  });

  it("silme çerezini max-age=0 ile temsil eder", () => {
    expect(parseSetCookie("access_token=; Path=/; Max-Age=0")).toMatchObject({
      name: "access_token",
      value: "",
      path: "/",
      maxAge: 0,
    });
  });

  it("name=value yoksa null döner", () => {
    expect(parseSetCookie("justtext")).toBeNull();
    expect(parseSetCookie("=value")).toBeNull();
  });
});

describe("normalizeSetCookies", () => {
  it("geçersiz satırları atlar, geçerli olanları döner", () => {
    const cookies = normalizeSetCookies([
      "access_token=a; Path=/",
      "broken",
      "refresh_token=r; Path=/api/v1/auth",
    ]);
    expect(cookies.map((cookie) => cookie.name)).toEqual(["access_token", "refresh_token"]);
  });
});

describe("getSetCookieHeaders", () => {
  it("çoklu set-cookie başlığını korur", () => {
    const headers = new Headers();
    headers.append("set-cookie", "a=1; Path=/");
    headers.append("set-cookie", "b=2; Path=/api/v1/auth");
    expect(getSetCookieHeaders(headers)).toEqual(["a=1; Path=/", "b=2; Path=/api/v1/auth"]);
  });
});
