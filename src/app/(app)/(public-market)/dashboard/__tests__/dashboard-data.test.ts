/**
 * `/dashboard` veri paketi testleri (Faz 5B / Birim 5B.1, P-05).
 *
 * `fetchDashboardData` gerçek `serverAuthApiFetch` üzerinden `global.fetch`
 * çağırır; testte ağ mock'lanır ve istek sayısı/paths doğrulanır.
 *
 * Doğrulananlar:
 *   - tam paket: 6 bağımsız + favori varsa 1 toplu = 7 istek,
 *   - ekonomi quote'ları FR + metal TEK istekte (`symbols=`, `group` yok),
 *   - güncel digest TEK istekte (tazelik `?at=` sorgusu yok),
 *   - favori boşken `/companies/summary` ÇAĞRILMAZ (6 istek),
 *   - backend tamamen kapalıyken çökme yok, `null`/boş dönüş.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchDashboardData,
  PULSE_SYMBOLS,
} from "@/app/(app)/(public-market)/dashboard/dashboard-data";
import type { Digest } from "@/lib/digest/types";
import { mockResponse } from "@/test/http";

type RecordedCall = {
  path: string;
  params: URLSearchParams;
};

let calls: RecordedCall[] = [];

const STATUS = {
  open: true,
  next_open_at: null,
  timezone: "Europe/Istanbul",
  is_holiday: false,
  holiday_name: null,
  as_of: "2026-09-22T08:00:00Z",
};

function digest(): Digest {
  return {
    id: "d1",
    date: "2026-09-22",
    slot: "morning",
    title: "Sabah bülteni",
    content: "Özet",
    sections: [],
    metadata: {},
    language: "tr",
    created_at: "2026-09-22T07:00:00Z",
  };
}

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

function baseHandlers(favorites: string[]): Handlers {
  return {
    "/api/v1/portfolios/summaries": () => mockResponse({ items: [] }),
    "/api/v1/favorites": () => mockResponse({ favorites }),
    "/api/v1/market/status": () => mockResponse(STATUS),
    "/api/v1/economy/quotes": () =>
      mockResponse({ ts: STATUS.as_of, source: null, quotes: {}, remaining: null }),
    "/api/v1/digest": () => mockResponse(digest()),
    "/api/v1/profile": () =>
      mockResponse({
        username: "ada",
        email: "ada@example.com",
        user_type: "user",
        created_at: null,
        email_verified: true,
        avatar_id: null,
        credits: 10,
      }),
    "/api/v1/companies/summary": () => mockResponse({ data: [], total: 0 }),
  };
}

const callsTo = (path: string) => calls.filter((call) => call.path === path);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchDashboardData", () => {
  it("favori varken 7 istek atar; ekonomi ve digest TEK istek (P-05)", async () => {
    installFetch(baseHandlers(["THYAO", "ASELS"]));

    const data = await fetchDashboardData();

    expect(data.favorites).toEqual(["THYAO", "ASELS"]);
    expect(data.profile?.email_verified).toBe(true);
    expect(calls).toHaveLength(7);

    const economy = callsTo("/api/v1/economy/quotes");
    expect(economy).toHaveLength(1);
    expect(economy[0]!.params.get("symbols")).toBe(PULSE_SYMBOLS.join(","));
    expect(economy[0]!.params.get("group")).toBeNull();

    const digestCalls = callsTo("/api/v1/digest");
    expect(digestCalls).toHaveLength(1);
    expect(digestCalls[0]!.params.get("at")).toBeNull();

    const summary = callsTo("/api/v1/companies/summary");
    expect(summary).toHaveLength(1);
    expect(summary[0]!.params.get("tickers")).toBe("THYAO,ASELS");
  });

  it("favori boşken companies/summary çağrılmaz (6 istek)", async () => {
    installFetch(baseHandlers([]));

    const data = await fetchDashboardData();

    expect(data.favorites).toEqual([]);
    expect(data.companies).toBeNull();
    expect(callsTo("/api/v1/companies/summary")).toHaveLength(0);
    expect(calls).toHaveLength(6);
  });

  it("backend tamamen kapalıyken çökmez; boş/hata sonucu döner", async () => {
    calls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("backend unreachable");
      }),
    );

    const data = await fetchDashboardData();

    expect(data.summary).toBeNull();
    expect(data.favorites).toEqual([]);
    expect(data.companies).toBeNull();
    expect(data.pulse).toBeNull();
    expect(data.status).toBeNull();
    expect(data.digest).toEqual({ digest: null, failed: true });
    expect(data.profile).toBeNull();
  });
});
