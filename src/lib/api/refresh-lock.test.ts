/**
 * İstemci refresh kilidi testleri (plan S-12).
 *
 * jsdom'da ne `navigator.locks` ne `BroadcastChannel` bulunur; bu yüzden
 * in-memory tek-uçuş (inflight) yolu doğrulanır: eşzamanlı iki çağrı tek
 * fetch üretir.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockResponse } from "@/test/http";

describe("refreshSessionClient", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("eşzamanlı iki çağrı tek refresh üretir", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({}, 200));
    vi.stubGlobal("fetch", fetchMock);

    const { refreshSessionClient } = await import("@/lib/api/refresh-lock");
    const [first, second] = await Promise.all([
      refreshSessionClient(),
      refreshSessionClient(),
    ]);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/auth/refresh");
  });

  it("başarısız yenilemede false döner", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ detail: "nope" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    const { refreshSessionClient } = await import("@/lib/api/refresh-lock");
    await expect(refreshSessionClient()).resolves.toBe(false);
  });

  it("ağ hatasında false döner ve fırlatmaz", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    const { refreshSessionClient } = await import("@/lib/api/refresh-lock");
    await expect(refreshSessionClient()).resolves.toBe(false);
  });
});
