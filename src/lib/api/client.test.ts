/**
 * İstemci API katmanı testleri (plan §2.4, S-12).
 *
 * Başarı, 401 → refresh → tekrar deneme, refresh başarısızlığında
 * `auth:unauthorized` olayı ve JSON gövde/başlık davranışı doğrulanır.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockResponse } from "@/test/http";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("başarılı JSON yanıtını döner", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ username: "efe" }));
    vi.stubGlobal("fetch", fetchMock);

    const { apiFetch } = await import("@/lib/api/client");
    const data = await apiFetch<{ username: string }>("/api/v1/profile");

    expect(data.username).toBe("efe");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("401 alınca oturumu yeniler ve isteği bir kez tekrarlar", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ detail: "Invalid or expired token" }, 401))
      .mockResolvedValueOnce(mockResponse({}, 200))
      .mockResolvedValueOnce(mockResponse({ username: "efe" }));
    vi.stubGlobal("fetch", fetchMock);

    const { apiFetch } = await import("@/lib/api/client");
    const data = await apiFetch<{ username: string }>("/api/v1/profile");

    expect(data.username).toBe("efe");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/v1/auth/refresh");
  });

  it("refresh başarısızsa hata fırlatır ve auth:unauthorized yayınlar", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ detail: "Invalid or expired token" }, 401))
      .mockResolvedValueOnce(mockResponse({}, 401));
    vi.stubGlobal("fetch", fetchMock);

    const listener = vi.fn();
    window.addEventListener("auth:unauthorized", listener);

    const { apiFetch, ApiError } = await import("@/lib/api/client");
    await expect(apiFetch("/api/v1/profile")).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener("auth:unauthorized", listener);
  });

  it("düz nesne gövdeyi JSON olarak ve content-type ile gönderir", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { apiFetch } = await import("@/lib/api/client");
    await apiFetch("/api/v1/auth/register", {
      method: "POST",
      body: { username: "efe", email: "e@f.com", password: "0123456789" },
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ username: "efe", email: "e@f.com", password: "0123456789" }));
  });

  it("sorgu parametrelerini URL'e ekler (null/undefined atlanır)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    const { apiFetch } = await import("@/lib/api/client");
    await apiFetch("/api/v1/auth/verify-email", { query: { token: "abc", skip: null } });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/auth/verify-email?token=abc");
  });

  it("hata gövdesindeki detail değerini ApiError.code olarak taşır", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ detail: "error_username_taken" }, 400));
    vi.stubGlobal("fetch", fetchMock);

    const { apiFetch } = await import("@/lib/api/client");
    await expect(
      apiFetch("/api/v1/auth/register", { method: "POST", body: {} }),
    ).rejects.toMatchObject({ status: 400, code: "error_username_taken" });
  });
});
