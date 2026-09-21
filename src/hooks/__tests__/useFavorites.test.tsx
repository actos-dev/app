/**
 * Favori hook testleri (Faz 3 / Birim 3.3, U-12).
 *
 * Optimistic ekleme/çıkarma, hata halinde geri alma ve çift tıklama guard'ı
 * doğrulanır. `apiFetch` altındaki `fetch` mock'lanır; toast'lar `sonner`
 * mock'u ile gözlenir.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFavorites } from "@/hooks/useFavorites";
import { qk } from "@/lib/query/keys";
import { mockResponse } from "@/test/http";
import type { FavoritesResponse } from "@/types/favorites";
import messages from "../../../messages/tr.json";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

type Deferred = {
  promise: Promise<Response>;
  resolve: (response: Response) => void;
  reject: (error: unknown) => void;
};

function deferred(): Deferred {
  let resolve!: (response: Response) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Response>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type FetchCall = { method: string; path: string };

let calls: FetchCall[] = [];

function installFetch(
  handler: (method: string, path: string) => Response | Promise<Response> | null,
) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(url, "http://localhost:3000").pathname;
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ method, path });
      const response = handler(method, path);
      if (response === null) {
        throw new Error("network error");
      }
      return response;
    }),
  );
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="tr" messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
  return { client, wrapper };
}

function readFavorites(client: QueryClient): string[] {
  return client.getQueryData<FavoritesResponse>(qk.favorites())?.favorites ?? [];
}

beforeEach(() => {
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useFavorites", () => {
  it("ilk durumu GET /favorites'tan okur", async () => {
    installFetch((method) => {
      if (method === "GET") {
        return mockResponse({ favorites: ["ASELS"] });
      }
      return mockResponse({});
    });
    const { client, wrapper } = createWrapper();

    const { result } = renderHook(() => useFavorites(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isFavorite("ASELS")).toBe(true);
    expect(result.current.isFavorite("THYAO")).toBe(false);
    expect(readFavorites(client)).toEqual(["ASELS"]);
  });

  it("ekleme isteğini optimistic uygular, başarıda toast gösterir", async () => {
    const post = deferred();
    installFetch((method) => {
      if (method === "GET") {
        return mockResponse({ favorites: [] });
      }
      return post.promise;
    });
    const { client, wrapper } = createWrapper();

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.toggle("THYAO");
    });

    // İstek çözülmeden önbellek güncellenmiş olmalı (optimistic).
    await waitFor(() => expect(readFavorites(client)).toContain("THYAO"));

    await act(async () => {
      post.resolve(mockResponse({ message: "ok" }));
      await post.promise;
    });

    await waitFor(() => expect(vi.mocked(toast.success)).toHaveBeenCalledTimes(1));
    expect(calls.some((call) => call.method === "POST" && call.path === "/api/v1/favorites/THYAO")).toBe(
      true,
    );
  });

  it("çıkarma isteğini optimistic uygular (DELETE)", async () => {
    const del = deferred();
    installFetch((method) => {
      if (method === "GET") {
        return mockResponse({ favorites: ["THYAO"] });
      }
      return del.promise;
    });
    const { client, wrapper } = createWrapper();

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isFavorite("THYAO")).toBe(true));

    act(() => {
      result.current.toggle("THYAO");
    });

    await waitFor(() => expect(readFavorites(client)).not.toContain("THYAO"));

    await act(async () => {
      del.resolve(mockResponse({ message: "ok" }));
      await del.promise;
    });

    expect(calls.some((call) => call.method === "DELETE")).toBe(true);
  });

  it("istek başarısız olursa optimistic değişikliği geri alır ve hata toast'ı gösterir", async () => {
    const post = deferred();
    installFetch((method) => {
      if (method === "GET") {
        return mockResponse({ favorites: [] });
      }
      return post.promise;
    });
    const { client, wrapper } = createWrapper();

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.toggle("THYAO");
    });
    await waitFor(() => expect(readFavorites(client)).toContain("THYAO"));

    await act(async () => {
      post.reject(new Error("network error"));
      await post.promise.catch(() => undefined);
    });

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(readFavorites(client)).not.toContain("THYAO"));
  });

  it("aynı sembole hızlı çift tıklamada tek istek atar", async () => {
    const post = deferred();
    installFetch((method) => {
      if (method === "GET") {
        return mockResponse({ favorites: [] });
      }
      return post.promise;
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.toggle("THYAO");
      result.current.toggle("THYAO");
    });

    await waitFor(() =>
      expect(calls.filter((call) => call.method === "POST")).toHaveLength(1),
    );

    await act(async () => {
      post.resolve(mockResponse({ message: "ok" }));
      await post.promise;
    });
  });
});
