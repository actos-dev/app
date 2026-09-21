/**
 * `/markets` sayfa veri akışı testleri (Faz 3 / Birim 3.2, P-02).
 *
 * Sayfa sunucu bileşenidir; `global.fetch` mock'lanır ve gerçek `tr`
 * kataloğuyla render edilir. Doğrulananlar:
 *   - `asset` parametresine göre DOĞRU endpoint'in çağrıldığı,
 *   - her sekme için tam olarak BEK.ENEN sayıda istek atıldığı (çift istek /
 *     N+1 yok),
 *   - backend kapalıyken (`fetch` reject) sayfanın çökmediği,
 *   - `/market/status` çerez ile çağrıldığı.
 *
 * NOT: Sayfa, `asset` sekmesinin tablosunu istemci bir bileşene devreder;
 * RSC testinde bu tablo ile bir kez render edilir ve KENDİ isteğini atmaz.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MarketsPage from "@/app/(app)/(public-market)/markets/page";
import { renderWithIntl } from "@/test/test-utils";

/** Sayfa, `MarketStatusPill` (React Query) render ettiği için sağlayıcı şart. */
function renderPage(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next-intl/server", async () => {
  const messages = (await import("../../../../../../messages/tr.json")).default as Record<string, unknown>;
  const resolve = (namespace: string | undefined, key: string, values?: Record<string, unknown>): string => {
    const path = namespace ? `${namespace}.${key}` : key;
    let current: unknown = messages;
    for (const part of path.split(".")) {
      current =
        current !== null && typeof current === "object"
          ? (current as Record<string, unknown>)[part]
          : undefined;
    }
    if (typeof current !== "string") {
      return path;
    }
    if (!values) {
      return current;
    }
    return current.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in values ? String(values[name]) : match,
    );
  };
  return {
    getTranslations:
      (namespace?: string) =>
      (key: string, values?: Record<string, unknown>) =>
        resolve(namespace, key, values),
  };
});

const statusPayload = {
  open: true,
  next_open_at: null,
  timezone: "Europe/Istanbul",
  is_holiday: false,
  holiday_name: null,
  as_of: "2026-09-21T08:00:00Z",
};

const companiesPayload = {
  data: [
    {
      ticker: "ASELS",
      name: "Aselsan",
      sector: "Teknoloji",
      last_price: 120.5,
      change_pct: 1.2,
      previous_close: 119,
      absolute_change: 1.5,
      change_window: "last_session_change",
      market_status: "open",
      is_stale: false,
      as_of: "2026-09-21T08:00:00Z",
      previous_close_as_of: "2026-09-20T15:00:00Z",
      day_high: 122,
      day_low: 118,
      volume: 1_000_000,
      market_cap: 500_000_000,
      currency: "TRY",
      price_updated_at: "2026-09-21T08:00:00Z",
    },
  ],
  total: 431,
};

const quotesPayload = {
  ts: "2026-09-21T08:00:00Z",
  source: "genelpara",
  quotes: {
    USD: {
      symbol: "USD",
      buying: 41.2,
      selling: 41.3,
      price: 41.25,
      change_pct: 0.12,
      change_text: null,
      currency: "TRY",
      unit: "1",
      source: "genelpara",
      ts: "2026-09-21T08:00:00Z",
      stale: false,
      extra: {},
    },
  },
  remaining: null,
};

const iposPayload = [
  {
    id: 1,
    slug: "ornek-halka-arz",
    title: "Örnek Halka Arz A.Ş.",
    link: "https://halkarz.com/ornek-halka-arz",
    date: "2026-09-18T00:00:00",
    modified: null,
  },
];

type FetchCall = { url: string; path: string; cookie: string | null };

let calls: FetchCall[] = [];

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function installFetch(handler: (path: string) => Response | null) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(url).pathname;
      const headers = new Headers(init?.headers);
      calls.push({ url, path, cookie: headers.get("cookie") });
      const response = handler(path);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/markets — hisse sekmesi (varsayılan)", () => {
  it("companies/summary ve market/status'u çeker; tablo başına tek istek", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/companies/summary") return jsonResponse(companiesPayload);
      return null;
    });

    renderPage(await MarketsPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }));

    const paths = calls.map((call) => call.path).sort();
    expect(paths).toEqual(["/api/v1/companies/summary", "/api/v1/market/status"]);
    expect(calls.filter((call) => call.path === "/api/v1/companies/summary")).toHaveLength(1);
    const table = screen.getByRole("table", { name: "Hisseler" });
    expect(table).toHaveAttribute("aria-rowcount", "431");
    expect(screen.getByText("431 sonuç")).toBeInTheDocument();
  });

  it("sort ve page parametrelerini isteğe yansıtır", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/companies/summary") return jsonResponse(companiesPayload);
      return null;
    });

    await MarketsPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve({ asset: "stocks", sort: "gainers", page: "3" }),
    });

    const summaryCall = calls.find((call) => call.path === "/api/v1/companies/summary");
    expect(summaryCall).toBeDefined();
    const query = new URL(summaryCall!.url).searchParams;
    expect(query.get("sort")).toBe("gainers");
    expect(query.get("limit")).toBe("50");
    expect(query.get("offset")).toBe("100");
  });

  it("hisse listesi boş dönerse boş durum gösterir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/companies/summary") return jsonResponse({ data: [], total: 0 });
      return null;
    });

    renderPage(await MarketsPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Gösterilecek kayıt yok.")).toBeInTheDocument();
  });
});

describe("/markets — döviz ve metal sekmeleri", () => {
  it("fx sekmesi tek /economy/quotes?group=fx isteği atar", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/economy/quotes") return jsonResponse(quotesPayload);
      return null;
    });

    renderPage(await MarketsPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ asset: "fx" }) }));

    const quoteCalls = calls.filter((call) => call.path === "/api/v1/economy/quotes");
    expect(quoteCalls).toHaveLength(1);
    expect(new URL(quoteCalls[0]!.url).searchParams.get("group")).toBe("fx");
    expect(calls.some((call) => call.path === "/api/v1/companies/summary")).toBe(false);
  });

  it("metals sekmesi group=metal gönderir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/economy/quotes") return jsonResponse(quotesPayload);
      return null;
    });

    await MarketsPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ asset: "metals" }) });

    const quoteCall = calls.find((call) => call.path === "/api/v1/economy/quotes");
    expect(new URL(quoteCall!.url).searchParams.get("group")).toBe("metal");
  });

  it("döviz listesi boşsa boş durum gösterir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/economy/quotes") return jsonResponse({ ...quotesPayload, quotes: {} });
      return null;
    });

    renderPage(await MarketsPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ asset: "fx" }) }));

    expect(screen.getByText("Gösterilecek kayıt yok.")).toBeInTheDocument();
  });
});

describe("/markets — halka arz sekmesi", () => {
  it("aktif, yaklaşan ve taslak listelerini birleştirir (3 istek)", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path.startsWith("/api/v1/ipos/")) return jsonResponse(iposPayload);
      return null;
    });

    renderPage(await MarketsPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ asset: "ipos" }) }));

    const ipoCalls = calls.filter((call) => call.path.startsWith("/api/v1/ipos/"));
    expect(ipoCalls.map((call) => call.path).sort()).toEqual([
      "/api/v1/ipos/active",
      "/api/v1/ipos/draft",
      "/api/v1/ipos/upcoming",
    ]);
    const table = await screen.findByRole("table", { name: "Halka Arz" });
    expect(table).toHaveAttribute("aria-rowcount", "3");
  });

  it("her sekme render'ı toplam backend çağrı sayısını raporlar (N+1 yok)", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/companies/summary") return jsonResponse(companiesPayload);
      if (path === "/api/v1/economy/quotes") return jsonResponse(quotesPayload);
      if (path.startsWith("/api/v1/ipos/")) return jsonResponse(iposPayload);
      return null;
    });

    // "Satır/kart başına istek" (P-02) yokluğunun kanıtı: sekme başına çağrı
    // sayısı veri boyutundan bağımsızdır.
    const perTab: Record<string, number> = {};
    for (const asset of ["stocks", "fx", "metals", "ipos"] as const) {
      calls = [];
      await MarketsPage({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({ asset }),
      });
      perTab[asset] = calls.length;
    }

    console.log(`[markets] backend çağrı sayıları: ${JSON.stringify(perTab)}`);
    expect(perTab).toEqual({ stocks: 2, fx: 2, metals: 2, ipos: 4 });
  });

  it("üç uç da başarısızsa hata durumu gösterir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      return null;
    });

    renderPage(await MarketsPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ asset: "ipos" }) }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getAllByText("Veriler yüklenemedi.").length).toBeGreaterThan(0);
  });
});

describe("/markets — dayanıklılık", () => {
  it("backend tamamen kapalıyken çöker değil; hata durumu gösterir", async () => {
    installFetch(() => null);

    renderPage(await MarketsPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Piyasalar")).toBeInTheDocument();
  });

  it("public veriyi ÇEREZSİZ çeker (5C / X-05)", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") return jsonResponse(statusPayload);
      if (path === "/api/v1/companies/summary") return jsonResponse(companiesPayload);
      return null;
    });

    renderPage(await MarketsPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }));

    expect(calls.length).toBeGreaterThan(0);
    // Paylaşılan önbelleğe girebilsin ve anonime açık olsun diye çerez YOK.
    for (const call of calls) {
      expect(call.cookie, call.path).toBeNull();
    }
  });

  it("429 + Retry-After'da uyarı gösterir (5C / X-07)", async () => {
    installFetch((path) => {
      if (path === "/api/v1/market/status") {
        return new Response(JSON.stringify({ detail: "too many" }), {
          status: 429,
          headers: { "content-type": "application/json", "retry-after": "15" },
        });
      }
      if (path === "/api/v1/companies/summary") return jsonResponse(companiesPayload);
      return null;
    });

    renderPage(await MarketsPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Çok fazla istek gönderildi")).toBeInTheDocument();
    expect(screen.getByText("15 saniye sonra tekrar dene.")).toBeInTheDocument();
    // Veri yine de gösterilir; uyarı sayfayı boşaltmaz.
    expect(screen.getByRole("table", { name: "Hisseler" })).toBeInTheDocument();
  });
});
