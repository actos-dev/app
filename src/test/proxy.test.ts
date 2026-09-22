/**
 * Proxy güvenlik başlıkları testleri (plan S-05, Faz 6).
 *
 * Her belge isteğine nonce'lu CSP yazılmalı; nonce hem yanıt başlığında hem de
 * Next'in render sırasında okuduğu istek başlığında bulunmalı. Kişisel rota
 * oturumsuzsa login'e yönlenir ama CSP yine de eklenir.
 */
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "@/proxy";

/** İmzasız, süresi gelecekte olan sahte access token (yalnız `exp` okunur). */
function makeAccessToken(expSecondsFromNow = 3600): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${payload}.signature`;
}

function requestFor(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3100"));
}

describe("proxy — CSP ve nonce", () => {
  it("public rotada nonce'lu CSP üretir ve nonce'ı isteğe geçirir", async () => {
    const response = await proxy(requestFor("/markets"));

    const csp = response.headers.get("content-security-policy");
    expect(csp).toMatch(/script-src [^;]*'nonce-[^']+'/);
    expect(csp).toContain("'strict-dynamic'");

    // Next, değiştirilen istek başlıklarını `x-middleware-request-*` ile taşır.
    const requestNonce = response.headers.get("x-middleware-request-x-nonce");
    expect(requestNonce).toBeTruthy();
    expect(csp).toContain(`'nonce-${requestNonce}'`);
    expect(response.headers.get("x-middleware-request-content-security-policy")).toBe(csp);
  });

  it("her istekte farklı nonce üretir", async () => {
    const first = await proxy(requestFor("/markets"));
    const second = await proxy(requestFor("/markets"));

    expect(first.headers.get("x-middleware-request-x-nonce")).not.toBe(
      second.headers.get("x-middleware-request-x-nonce"),
    );
  });

  it("korunan rota oturumsuzsa login'e yönlendirir ama CSP'yi yine de ekler", async () => {
    const response = await proxy(requestFor("/portfolio"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?next=");
    expect(response.headers.get("content-security-policy")).toMatch(/'nonce-/);
  });

  it("geçerli access token'ı olan korunan rotayı yönlendirmez", async () => {
    const request = new NextRequest(new URL("/profile", "http://localhost:3100"), {
      headers: { cookie: `access_token=${makeAccessToken()}` },
    });

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("content-security-policy")).toMatch(/'nonce-/);
  });
});
