// @vitest-environment node
/**
 * BFF proxy handler testleri (plan M-02, S-01).
 *
 * `fetch` mock'lanır; handler gerçek backend'e gitmez. Node ortamı gerekir
 * çünkü `NextRequest`/streaming gövde Node fetch semantiği ister.
 */
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/v1/[...path]/route";

type ProxyContext = { params: Promise<{ path: string[] }> };

function context(...path: string[]): ProxyContext {
  return { params: Promise.resolve({ path }) };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("BFF proxy", () => {
  it("GET isteğini doğru URL, çerez ve allowlist başlıklarla backend'e taşır", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ open: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest(
      "http://localhost:3000/api/v1/market/status?symbols=THYAO,GARAN",
      { headers: { cookie: "access_token=abc", host: "localhost:3000" } },
    );

    const response = await GET(request, context("market", "status"));

    expect(response.status).toBe(200);
    const [target, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(target.origin).toBe("http://localhost:7055");
    expect(target.pathname).toBe("/api/v1/market/status");
    expect(target.searchParams.get("symbols")).toBe("THYAO,GARAN");

    const sentHeaders = new Headers(init.headers);
    expect(sentHeaders.get("cookie")).toBe("access_token=abc");
    expect(sentHeaders.get("host")).toBeNull();
  });

  it("mutasyonda farklı origin'i 403 ile reddeder, backend'e gitmez", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: "http://evil.example",
      },
      body: "username=a&password=b",
    });

    const response = await POST(request, context("auth", "login"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ detail: "error_csrf_origin_mismatch" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("proxy arkasında (x-forwarded-host) genel origin'i kabul eder", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    // Next iç adresi 127.0.0.1:3300 ama tarayıcı https://florencex.com.tr görür.
    const request = new NextRequest("http://127.0.0.1:3300/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://florencex.com.tr",
        "x-forwarded-host": "florencex.com.tr",
        "x-forwarded-proto": "https",
      },
      body: "username=a&password=b",
    });

    const response = await POST(request, context("auth", "login"));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("NEXT_PUBLIC_SITE_URL origin'ini de kabul eder", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://florencex.com.tr/");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://127.0.0.1:3300/api/v1/auth/refresh", {
      method: "POST",
      headers: { origin: "https://florencex.com.tr" },
    });

    const response = await POST(request, context("auth", "refresh"));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("aynı-origin mutasyonu iletir ve gövdeyi akıtır", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: "http://localhost:3000",
        "sec-fetch-site": "same-origin",
      },
      body: "username=a&password=b",
    });

    const response = await POST(request, context("auth", "login"));

    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit & { duplex?: string }];
    expect(init.method).toBe("POST");
    expect(init.duplex).toBe("half");
    expect(init.body).toBeInstanceOf(ReadableStream);
  });

  it("çoklu Set-Cookie başlığını tarayıcıya korur", async () => {
    const backendHeaders = new Headers({ "content-type": "application/json" });
    backendHeaders.append("set-cookie", "access_token=new; Path=/; HttpOnly; SameSite=strict");
    backendHeaders.append(
      "set-cookie",
      "refresh_token=rot; Path=/api/v1/auth; HttpOnly; SameSite=strict",
    );
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: backendHeaders }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost:3000/api/v1/auth/refresh", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });

    const response = await POST(request, context("auth", "refresh"));

    const setCookies = response.headers.getSetCookie();
    expect(setCookies).toContain("access_token=new; Path=/; HttpOnly; SameSite=strict");
    expect(setCookies).toContain("refresh_token=rot; Path=/api/v1/auth; HttpOnly; SameSite=strict");
  });

  it("backend kapalıyken 502 döner (çökme yok)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost:3000/api/v1/market/status");

    const response = await GET(request, context("market", "status"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ detail: "error_backend_unreachable" });
  });
});
