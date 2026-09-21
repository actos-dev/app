/**
 * `ReportHistory` testleri (Faz 5 / Birim 5A.1, U-06, S-11).
 *
 * Doğrulananlar:
 *   - geçmiş listesinin istemci sayfalamasıyla gösterilmesi,
 *   - boş durum,
 *   - arama parametrelerinin (`q`, `limit`, `offset`) sunucuya gitmesi ve
 *     sayfa değişiminde `offset` güncellenmesi.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ReportHistory } from "@/components/reports/ReportHistory";
import type { ReportHistoryItem } from "@/lib/reports/types";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function makeItem(id: number): ReportHistoryItem {
  return {
    id,
    ticker: "THYAO",
    type: "quick_report",
    title: `Rapor ${id}`,
    token_usage: { total: 10000 },
    credits_spend: 10,
    purpose: null,
    created_at: `2026-09-${String((id % 27) + 1).padStart(2, "0")}T10:00:00Z`,
  };
}

const manyItems: ReportHistoryItem[] = Array.from({ length: 25 }, (_, index) => makeItem(index + 1));
const searchItems: ReportHistoryItem[] = Array.from({ length: 20 }, (_, index) => makeItem(index + 100));

type FetchCall = { path: string; url: string };

let calls: FetchCall[] = [];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function installFetch(handler: (path: string) => Response | null) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const raw =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(raw, "http://localhost").pathname;
      calls.push({ path, url: raw });
      const response = handler(path);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

function searchCalls(): FetchCall[] {
  return calls.filter((call) => call.path === "/api/v1/reports/search");
}

function renderHistory(initialHistory?: ReportHistoryItem[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <ReportHistory {...(initialHistory ? { initialHistory } : {})} />
    </QueryClientProvider>,
  );
}

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 480 });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => 800 });
});

afterAll(() => {
  if (originalOffsetHeight) {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
  }
  if (originalOffsetWidth) {
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReportHistory — liste ve boş durum", () => {
  it("geçmişi sayfalar ve toplam sayıyı gösterir", async () => {
    installFetch(() => null);
    const user = userEvent.setup();
    renderHistory(manyItems);

    expect(screen.getByText("25 rapor")).toBeInTheDocument();
    expect(screen.getByText("Sayfa 1 / 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sonraki" }));
    expect(await screen.findByText("Sayfa 2 / 2")).toBeInTheDocument();
  });

  it("boş geçmişte boş durum gösterir", () => {
    installFetch(() => null);
    renderHistory([]);

    expect(screen.getByText("Henüz rapor yok")).toBeInTheDocument();
  });
});

describe("ReportHistory — arama", () => {
  it("arama parametrelerini gönderir ve sayfa değişiminde offset günceller", async () => {
    installFetch((path) => {
      if (path === "/api/v1/reports/history") return jsonResponse([]);
      if (path === "/api/v1/reports/search") return jsonResponse(searchItems);
      return null;
    });
    const user = userEvent.setup();
    renderHistory();

    await user.type(screen.getByRole("searchbox", { name: "Ara" }), "THYAO");

    await waitFor(() => {
      expect(searchCalls().length).toBeGreaterThanOrEqual(1);
    });
    const firstUrl = new URL(searchCalls()[0]!.url, "http://localhost");
    expect(firstUrl.searchParams.get("q")).toBe("THYAO");
    expect(firstUrl.searchParams.get("limit")).toBe("20");
    expect(firstUrl.searchParams.get("offset")).toBe("0");

    await user.click(await screen.findByRole("button", { name: "Sonraki" }));

    await waitFor(() => {
      const offsets = searchCalls().map((call) =>
        new URL(call.url, "http://localhost").searchParams.get("offset"),
      );
      expect(offsets).toContain("20");
    });
  });
});
