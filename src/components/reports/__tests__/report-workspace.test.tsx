/**
 * `ReportsWorkspace` üretim akışı testi (Faz 5 / Birim 5A.1, U-03, U-06).
 *
 * Başarılı senkron üretimden sonra:
 *   - geçmiş ve kredi sorguları tazelenir (invalidate),
 *   - detay sayfasına giden link gösterilir.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ReportsWorkspace } from "@/components/reports/ReportsWorkspace";
import type { ReportHistoryItem, ReportInfo } from "@/lib/reports/types";
import { renderWithIntl } from "@/test/test-utils";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const reportInfo: ReportInfo = {
  quick_report: {
    type: "quick_report",
    name_en: "Quick Report",
    name_tr: "Hızlı Rapor",
    description: "quick",
    description_tr: "hizli",
    est_cost: 20,
  },
  deep_report: {
    type: "deep_report",
    name_en: "Deep Report",
    name_tr: "Derin Rapor",
    description: "deep",
    description_tr: "derin",
    est_cost: 30,
  },
  token_cost_per_1k: 1,
};

const historyItems: ReportHistoryItem[] = [
  {
    id: 7,
    ticker: "THYAO",
    type: "quick_report",
    title: "THYAO Özeti",
    token_usage: { total: 12000 },
    credits_spend: 12,
    purpose: null,
    created_at: "2026-09-20T10:00:00Z",
  },
];

const generatePayload = {
  success: true,
  report_id: 42,
  credits_spend: 20,
  remaining_credits: 80,
  about: "ASELS",
  type: "quick_report",
  title: "ASELS Analizi",
  report: "## Özet\n\nOlumlu görünüm.",
  sentiments: [],
  token_usage: { prompt: 100, completion: 200, total: 300 },
  created_at: "2026-09-21T10:00:00Z",
};

const searchResults = [{ ticker: "ASELS", name: "Aselsan Elektronik", score: 100 }];

type FetchCall = { path: string; method: string };

let calls: FetchCall[] = [];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function installFetch(handler: (path: string, method: string) => Response | null) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const raw =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(raw, "http://localhost").pathname;
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ path, method });
      const response = handler(path, method);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

function countPath(path: string): number {
  return calls.filter((call) => call.path === path).length;
}

function renderWorkspace() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <ReportsWorkspace
        initialInfo={reportInfo}
        initialCredits={{ credits: 100 }}
        initialHistory={historyItems}
      />
    </QueryClientProvider>,
  );
}

// jsdom öğe boyutlarını 0 döndürür; sanallaştırıcı satırları çizebilsin diye.
const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => 480,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 800,
  });
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
  vi.mocked(toast.success).mockReset();
});

describe("ReportsWorkspace — başarılı üretim", () => {
  it("geçmiş + krediyi tazeler ve detay linkini gösterir", async () => {
    installFetch((path, method) => {
      if (path === "/api/v1/companies/search") return jsonResponse(searchResults);
      if (path === "/api/v1/reports/generate" && method === "POST") {
        return jsonResponse(generatePayload);
      }
      if (path === "/api/v1/reports/history") return jsonResponse(historyItems);
      if (path === "/api/v1/credits") return jsonResponse({ credits: 80 });
      return null;
    });
    const user = userEvent.setup();
    renderWorkspace();

    // İlk yüklemede ek istek yok: veri RSC'den tohumlandı.
    expect(countPath("/api/v1/reports/history")).toBe(0);
    expect(countPath("/api/v1/credits")).toBe(0);

    await user.click(screen.getByRole("combobox", { name: "Rapor tipi" }));
    await user.click(await screen.findByRole("option", { name: /Hızlı Rapor/ }));

    const symbolInput = screen.getByRole("combobox", { name: "Hisse ara" });
    await user.type(symbolInput, "AS");
    await screen.findByRole("option", { name: /ASELS/ });
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    await user.click(screen.getByRole("button", { name: "Raporu üret" }));

    const link = await screen.findByRole("link", { name: "Raporu aç" });
    expect(link).toHaveAttribute("href", "/research/reports/42");

    await waitFor(() => {
      expect(countPath("/api/v1/reports/history")).toBeGreaterThanOrEqual(1);
    });
    await waitFor(() => {
      expect(countPath("/api/v1/credits")).toBeGreaterThanOrEqual(1);
    });
    expect(vi.mocked(toast.success)).toHaveBeenCalled();
  });
});
