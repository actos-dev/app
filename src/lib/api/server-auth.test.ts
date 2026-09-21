/**
 * `serverAuthApiFetch` testleri (Faz 3 / Birim 3.2).
 *
 * Korumalı SSR verisinin gelen isteğin `cookie` başlığıyla backend'e
 * gitmesi ve hata/ağ kesintisinde `null` dönmesi (sayfa çökmez) doğrulanır.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock("next/headers", () => ({ headers: headersMock }));

import { serverAuthApiFetch } from "@/lib/api/server-auth";

afterEach(() => {
  vi.unstubAllGlobals();
  headersMock.mockReset();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("serverAuthApiFetch", () => {
  it("gelen isteğin çerezini backend'e iletir ve no-store kullanır", async () => {
    headersMock.mockResolvedValue(new Headers({ cookie: "access_token=abc" }));
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await serverAuthApiFetch<{ ok: boolean }>("/api/v1/companies/summary");

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/api/v1/companies/summary");
    expect(new Headers(init.headers).get("cookie")).toBe("access_token=abc");
    expect(init.cache).toBe("no-store");
  });

  it("çerez yoksa cookie başlığı eklemez", async () => {
    headersMock.mockResolvedValue(new Headers());
    const fetchMock = vi.fn(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await serverAuthApiFetch("/api/v1/ipos/active");

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(new Headers(init.headers).has("cookie")).toBe(false);
  });

  it("2xx dışı yanıtta null döner", async () => {
    headersMock.mockResolvedValue(new Headers({ cookie: "access_token=abc" }));
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ detail: "unauthorized" }, 401)));

    await expect(serverAuthApiFetch("/api/v1/economy/quotes")).resolves.toBeNull();
  });

  it("ağ hatasında çökmez, null döner", async () => {
    headersMock.mockResolvedValue(new Headers());
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );

    await expect(serverAuthApiFetch("/api/v1/market/status")).resolves.toBeNull();
  });

  it("headers() istek bağlamı dışında olsa da çerezsiz devam eder", async () => {
    headersMock.mockRejectedValue(new Error("outside request scope"));
    const fetchMock = vi.fn(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(serverAuthApiFetch("/api/v1/companies/search")).resolves.toEqual([]);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(new Headers(init.headers).has("cookie")).toBe(false);
  });

  it("sorgu parametrelerini URL'e ekler", async () => {
    headersMock.mockResolvedValue(new Headers());
    const fetchMock = vi.fn(async () => jsonResponse({ data: [], total: 0 }));
    vi.stubGlobal("fetch", fetchMock);

    await serverAuthApiFetch("/api/v1/companies/summary", {
      query: { sort: "gainers", limit: 50, offset: 0 },
    });

    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    const query = new URL(url).searchParams;
    expect(query.get("sort")).toBe("gainers");
    expect(query.get("limit")).toBe("50");
    expect(query.get("offset")).toBe("0");
  });
});
