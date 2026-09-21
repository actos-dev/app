/**
 * `(private)` route group guard testleri (Faz 5C / Birim 5C.2a, X-02).
 *
 * Birincil kapı Proxy'dir; bu layout ikinci savunma katmanıdır: oturum yoksa
 * `?next=` ile login'e yönlendirir, varsa içeriği geçirir.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sessionMock, redirectMock, headersMock } = vi.hoisted(() => ({
  sessionMock: { value: null as unknown },
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
  headersMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: () => Promise.resolve(sessionMock.value),
}));

vi.mock("next/headers", () => ({ headers: headersMock }));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import PrivateLayout from "@/app/(app)/(private)/layout";

beforeEach(() => {
  redirectMock.mockClear();
  headersMock.mockReset();
});

describe("(private) layout", () => {
  it("oturum yoksa x-pathname ile login'e yönlendirir", async () => {
    sessionMock.value = null;
    headersMock.mockResolvedValue(
      new Headers({ "x-pathname": "/watchlist", "x-search": "?tab=1" }),
    );

    await expect(PrivateLayout({ children: null })).rejects.toThrow(
      "REDIRECT /login?next=%2Fwatchlist%3Ftab%3D1",
    );
  });

  it("oturum varsa içeriği geçirir", async () => {
    sessionMock.value = { id: 1 };

    await expect(PrivateLayout({ children: null })).resolves.toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
