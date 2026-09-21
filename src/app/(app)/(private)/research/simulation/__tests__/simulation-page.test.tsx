/**
 * `/research/simulation` sayfa testleri (Faz 5 / Birim 5A.2).
 *
 * Sunucu bileşeni doğrudan çağrılır; `global.fetch` mock'lanır. Doğrulananlar:
 *   - RSC verisinin (maliyet şeması, geçmiş, kredi) istemci adasına
 *     `initialData` olarak geçmesi,
 *   - backend kapalıyken sayfanın ÇÖKMEMESİ ve boş durumla render etmesi.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import SimulationPage from "@/app/(app)/(private)/research/simulation/page";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const perDayCost = { per_day_cost: 0.005, round: 3 };
const history = [
  {
    id: 1,
    ticker: "ASELS",
    days: 30,
    bounds: "0.05",
    target: "auto",
    cost: 0.15,
    created_at: "2026-09-21T10:00:00Z",
  },
];

function installFetch(handler: () => Response | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      const response = handler();
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

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

/** İstemci adasını QueryClient ile sarmalar (sayfa RSC + ada karışımıdır). */
function renderPage(page: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(<QueryClientProvider client={client}>{page}</QueryClientProvider>);
}

describe("/research/simulation", () => {
  it("RSC verisiyle render eder ve geçmişi tohumlar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const raw =
          typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        const path = new URL(raw, "http://localhost").pathname;
        if (path === "/api/v1/simulations/per-day-cost") return jsonResponse(perDayCost);
        if (path === "/api/v1/simulations/history") return jsonResponse(history);
        if (path === "/api/v1/credits") return jsonResponse({ credits: 42 });
        if (path === "/api/v1/maintenance") return jsonResponse({ disabled_features: [] });
        throw new Error("backend unreachable");
      }),
    );

    renderPage(await SimulationPage());

    expect(screen.getByRole("heading", { level: 1, name: "Simülasyon" })).toBeInTheDocument();
    // Geçmiş sekmesi keepMounted olduğundan satır ve toplam hemen DOM'da.
    expect(screen.getByText("ASELS")).toBeInTheDocument();
    expect(screen.getByText("1 simülasyon")).toBeInTheDocument();
  });

  it("backend kapalıyken çökmez ve hata durumu gösterir", async () => {
    installFetch(() => null);

    renderPage(await SimulationPage());

    expect(screen.getByRole("heading", { level: 1, name: "Simülasyon" })).toBeInTheDocument();
    // Geçmiş çekilemediğinde boş yerine net hata durumu gösterilir.
    expect(await screen.findByText("Simülasyon geçmişi yüklenemedi")).toBeInTheDocument();
  });
});
