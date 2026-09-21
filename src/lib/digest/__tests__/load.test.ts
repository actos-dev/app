/**
 * Bülten sunucu yükleyicileri testleri (Faz 5 / Birim 5A.3, U-08, S-15).
 *
 * Güncel/bayat/boş/hata durumları ile `date+slot` 404 ayrımı doğrulanır.
 * Ağ `fetch` mock'u ile kesilir; `next/headers` istek bağlamı taklit edilir.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock("next/headers", () => ({ headers: headersMock }));

import { loadCurrentDigest, loadDigestArchive, loadDigestBySlot } from "@/lib/digest/load";
import type { Digest } from "@/lib/digest/types";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function digest(overrides: Partial<Digest> = {}): Digest {
  return {
    id: "digest-1",
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

/** İstek URL'ine göre yanıt üreten fetch mock'u. */
function installFetch(handler: (url: URL) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => handler(new URL(String(input)))),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  headersMock.mockReset();
});

describe("loadCurrentDigest", () => {
  it("pencere bülteni güncel bültenle aynıysa taze işaretler", async () => {
    headersMock.mockResolvedValue(new Headers());
    const current = digest({ id: "cur" });
    installFetch(() => jsonResponse(current));

    const result = await loadCurrentDigest();

    expect(result.digest?.id).toBe("cur");
    expect(result.freshness).toBe("current");
    expect(result.failed).toBe(false);
  });

  it("pencere 404 ise bayat işaretler", async () => {
    headersMock.mockResolvedValue(new Headers());
    const current = digest({ id: "cur" });
    installFetch((url) =>
      url.searchParams.has("at") ? jsonResponse({ detail: "not found" }, 404) : jsonResponse(current),
    );

    const result = await loadCurrentDigest();

    expect(result.digest?.id).toBe("cur");
    expect(result.freshness).toBe("stale");
  });

  it("hiç bülten yoksa boş döner (hata değil)", async () => {
    headersMock.mockResolvedValue(new Headers());
    installFetch(() => jsonResponse({ detail: "no digest" }, 404));

    const result = await loadCurrentDigest();

    expect(result.digest).toBeNull();
    expect(result.failed).toBe(false);
  });

  it("backend hatasında failed true döner", async () => {
    headersMock.mockResolvedValue(new Headers());
    installFetch(() => jsonResponse({ detail: "boom" }, 500));

    const result = await loadCurrentDigest();

    expect(result.digest).toBeNull();
    expect(result.failed).toBe(true);
  });
});

describe("loadDigestArchive", () => {
  it("boş günü geçerli sonuç olarak döner", async () => {
    headersMock.mockResolvedValue(new Headers());
    installFetch(() => jsonResponse([], 200));

    await expect(loadDigestArchive("2026-09-01")).resolves.toEqual({
      status: "ok",
      digests: [],
    });
  });

  it("backend hatasında error döner", async () => {
    headersMock.mockResolvedValue(new Headers());
    installFetch(() => jsonResponse({ detail: "boom" }, 500));

    await expect(loadDigestArchive("2026-09-01")).resolves.toEqual({
      status: "error",
      digests: [],
    });
  });
});

describe("loadDigestBySlot", () => {
  it("404'ü not-found durumuna çevirir", async () => {
    headersMock.mockResolvedValue(new Headers());
    installFetch(() => jsonResponse({ detail: "not found" }, 404));

    await expect(loadDigestBySlot("2026-09-01", "morning")).resolves.toEqual({
      status: "not-found",
      digest: null,
    });
  });

  it("bülteni döner", async () => {
    headersMock.mockResolvedValue(new Headers());
    const value = digest({ id: "morning-1" });
    installFetch(() => jsonResponse(value));

    await expect(loadDigestBySlot("2026-09-01", "morning")).resolves.toEqual({
      status: "ok",
      digest: value,
    });
  });
});
