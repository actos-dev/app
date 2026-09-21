/**
 * `SimulationHistory` + `SimulationHistoryDialog` testleri
 * (Faz 5 / Birim 5A.2).
 *
 * Doğrulananlar:
 *   - geçmiş tablosunun satırları ve alan biçimleri (bounds → yüzde),
 *   - "Detay" ile `/simulations/history/{id}` çekilip diyalogda gösterilmesi,
 *   - boş durum.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { SimulationHistory } from "@/components/simulation/SimulationHistory";
import type { SimulationHistoryItem } from "@/lib/simulations/types";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const items: SimulationHistoryItem[] = [
  {
    id: 1,
    ticker: "ASELS",
    days: 30,
    bounds: "0.05",
    target: "auto",
    cost: 0.15,
    created_at: "2026-09-21T10:00:00Z",
  },
  {
    id: 2,
    ticker: "THYAO",
    days: 120,
    bounds: "0.025",
    target: "350",
    cost: 0.6,
    created_at: "2026-09-20T10:00:00Z",
  },
];

const detailPayload = {
  id: 2,
  ticker: "THYAO",
  days: 120,
  bounds: "0.025",
  target: "350",
  result: {
    prob_above: 0.41,
    prob_below: 0.59,
    confidence: { min: 200, max: 500, percent: 0.95, days: 120, bounds: "0.025" },
    direction: "above",
  },
  cost: 0.6,
  created_at: "2026-09-20T10:00:00Z",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function installFetch(handler: (path: string) => Response | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const raw =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(raw, "http://localhost").pathname;
      const response = handler(path);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

function renderHistory(initialHistory?: SimulationHistoryItem[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <SimulationHistory {...(initialHistory ? { initialHistory } : {})} />
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

describe("SimulationHistory — tablo", () => {
  it("satırları ve bounds yüzdesini gösterir", () => {
    installFetch(() => null);
    renderHistory(items);

    const table = screen.getByRole("table");
    expect(within(table).getByText("ASELS")).toBeInTheDocument();
    expect(within(table).getByText("THYAO")).toBeInTheDocument();
    // bounds 0.05 → %90, 0.025 → %95.
    expect(within(table).getByText("%90")).toBeInTheDocument();
    expect(within(table).getByText("%95")).toBeInTheDocument();
    // Hedef "auto" → otomatik; "350" → fiyat.
    expect(within(table).getByText("Otomatik")).toBeInTheDocument();
    expect(screen.getByText("2 simülasyon")).toBeInTheDocument();
  });

  it("boş geçmişte boş durum gösterir", () => {
    installFetch(() => null);
    renderHistory([]);

    expect(screen.getByText("Henüz simülasyon yok")).toBeInTheDocument();
  });
});

describe("SimulationHistory — detay diyaloğu", () => {
  it("detay butonuyla kaydı çeker ve özeti diyalogda gösterir", async () => {
    const calls: string[] = [];
    installFetch((path) => {
      calls.push(path);
      if (path === "/api/v1/simulations/history/2") return jsonResponse(detailPayload);
      return null;
    });
    const user = userEvent.setup();
    renderHistory(items);

    const table = screen.getByRole("table");
    const row = within(table).getByText("THYAO").closest('[role="row"]');
    expect(row).not.toBeNull();
    await user.click(within(row as HTMLElement).getByRole("button", { name: "Detay" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("THYAO simülasyonu")).toBeInTheDocument();
    expect(within(dialog).getByText("%41")).toBeInTheDocument();
    expect(within(dialog).getByText("200,00")).toBeInTheDocument();
    expect(within(dialog).getByText("500,00")).toBeInTheDocument();

    expect(calls).toContain("/api/v1/simulations/history/2");
  });
});
