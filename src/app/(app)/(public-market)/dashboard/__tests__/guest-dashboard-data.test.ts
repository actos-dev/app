/**
 * Misafir dashboard veri paketi testleri (Faz 5C / X-09, X-05, X-07).
 *
 * Doğrulananlar:
 *   - yalnız public uçlara istek (kişisel uçlara 0 istek),
 *   - 5 istek bütçesi; yükselen/düşen için iki ayrı `companies/summary`,
 *   - `429` + `Retry-After` bilgisinin pakete taşındığı,
 *   - backend kapalıyken çökme yok, güvenli boş dönüş.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchGuestDashboardData } from "@/app/(app)/(public-market)/dashboard/guest-dashboard-data";
import { mockResponse } from "@/test/http";

type RecordedCall = { path: string; params: URLSearchParams };

let calls: RecordedCall[] = [];

const STATUS = {
  open: true,
  next_open_at: null,
  timezone: "Europe/Istanbul",
  is_holiday: false,
  holiday_name: null,
  as_of: "2026-09-22T08:00:00Z",
};

type Handlers = Record<string, (url: URL) => Response>;

function installFetch(handlers: Handlers): void {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const raw =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(raw, "http://localhost:7055");
      calls.push({ path: url.pathname, params: url.searchParams });
      const handler = handlers[url.pathname];
      if (!handler) {
        return mockResponse({ detail: "not found" }, 404);
      }
      return handler(url);
    }),
  );
}

const callsTo = (path: string) => calls.filter((call) => call.path === path);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchGuestDashboardData", () => {
  function handlers(): Handlers {
    return {
      "/api/v1/market/status": () => mockResponse(STATUS),
      "/api/v1/economy/quotes": () =>
        mockResponse({ ts: STATUS.as_of, source: null, quotes: {}, remaining: null }),
      "/api/v1/companies/summary": () => mockResponse({ data: [], total: 0 }),
      "/api/v1/digest": () => mockResponse({ detail: "not found" }, 404),
    };
  }

  it("yalnız public uçlara 5 istek atar; kişisel uçlara 0", async () => {
    installFetch(handlers());

    const data = await fetchGuestDashboardData();

    expect(data.status?.open).toBe(true);
    expect(data.digest).toEqual({ digest: null, failed: false });
    expect(data.rateLimit).toEqual({ limited: false, retryAfter: null });

    const paths = calls.map((call) => call.path);
    expect(calls).toHaveLength(5);
    expect(paths).toContain("/api/v1/market/status");
    expect(paths).toContain("/api/v1/economy/quotes");
    expect(paths).toContain("/api/v1/digest");

    const summary = callsTo("/api/v1/companies/summary");
    expect(summary).toHaveLength(2);
    expect(summary.map((call) => call.params.get("sort")).sort()).toEqual(["gainers", "losers"]);

    for (const personal of [
      "/api/v1/favorites",
      "/api/v1/portfolios/summaries",
      "/api/v1/credits",
      "/api/v1/profile",
    ]) {
      expect(paths).not.toContain(personal);
    }
  });

  it("429 + Retry-After bilgisini taşır", async () => {
    installFetch({
      ...handlers(),
      "/api/v1/market/status": () =>
        mockResponse({ detail: "Too many requests" }, 429, { "retry-after": "30" }),
    });

    const data = await fetchGuestDashboardData();

    expect(data.rateLimit.limited).toBe(true);
    expect(data.rateLimit.retryAfter).toBe(30);
  });

  it("backend tamamen kapalıyken çökmez", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("backend unreachable");
      }),
    );

    const data = await fetchGuestDashboardData();

    expect(data.status).toBeNull();
    expect(data.pulse).toBeNull();
    expect(data.gainers).toEqual([]);
    expect(data.losers).toEqual([]);
    expect(data.digest).toEqual({ digest: null, failed: true });
    expect(data.rateLimit).toEqual({ limited: false, retryAfter: null });
  });
});
