/**
 * `ReportWizard` testleri (Faz 5 / Birim 5A.1, U-03, U-06, U-09).
 *
 * Doğrulananlar:
 *   - tip seçilince `/reports/info` maliyetinin gösterilmesi,
 *   - yetersiz kredide gönderimin BAŞTAN engellenmesi ve nedeninin yazılması,
 *   - üretim sürerken buton kilidi + dürüst ilerleme metni (sahte yüzde yok).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReportWizard } from "@/components/reports/ReportWizard";
import type { ReportInfo } from "@/lib/reports/types";
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

const searchResults = [{ ticker: "ASELS", name: "Aselsan Elektronik", score: 100 }];

type FetchCall = { path: string; method: string; url: string };

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
      calls.push({ path, method, url: raw });
      const response = handler(path, method);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

function renderWizard(credits: number) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <ReportWizard initialInfo={reportInfo} initialCredits={{ credits }} />
    </QueryClientProvider>,
  );
}

async function selectType(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole("combobox", { name: "Rapor tipi" }));
  await user.click(await screen.findByRole("option", { name }));
}

async function selectSymbol(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByRole("combobox", { name: "Hisse ara" });
  await user.type(input, "AS");
  await screen.findByRole("option", { name: /ASELS/ });
  await user.keyboard("{ArrowDown}");
  await user.keyboard("{Enter}");
}

afterEach(() => {
  vi.unstubAllGlobals();
  pushMock.mockReset();
});

describe("ReportWizard — maliyet ve kredi (U-03)", () => {
  it("tip seçilince tahmini maliyeti gösterir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/companies/search") return jsonResponse(searchResults);
      return null;
    });
    const user = userEvent.setup();
    renderWizard(100);

    expect(screen.getByTestId("estimated-cost")).toHaveTextContent("—");

    await selectType(user, /Derin Rapor/);

    await waitFor(() => {
      expect(screen.getByTestId("estimated-cost")).toHaveTextContent("30 kredi");
    });
  });

  it("yetersiz kredide gönderimi engeller ve nedenini açıklar", async () => {
    installFetch((path) => {
      if (path === "/api/v1/companies/search") return jsonResponse(searchResults);
      return null;
    });
    const user = userEvent.setup();
    renderWizard(5);

    await selectType(user, /Hızlı Rapor/);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Yetersiz kredi");
    expect(alert).toHaveTextContent("20 kredi");
    expect(alert).toHaveTextContent("5 kredi");

    const submit = screen.getByRole("button", { name: "Raporu üret" });
    expect(submit).toBeDisabled();
    expect(calls.some((call) => call.method === "POST")).toBe(false);
  });
});

describe("ReportWizard — senkron üretim (U-06)", () => {
  it("üretim sürerken butonu kilitler ve ilerleme metni gösterir", async () => {
    installFetch((path, method) => {
      if (path === "/api/v1/companies/search") return jsonResponse(searchResults);
      if (path === "/api/v1/reports/generate" && method === "POST") {
        // Yanıt hiç gelmez: istek asılı kalır (senkron 30-60 sn benzetimi).
        return new Promise<Response>(() => {}) as unknown as Response;
      }
      return null;
    });
    const user = userEvent.setup();
    renderWizard(100);

    await selectType(user, /Hızlı Rapor/);
    await selectSymbol(user);

    await user.click(screen.getByRole("button", { name: "Raporu üret" }));

    await waitFor(() => {
      expect(screen.getByText("Rapor üretiliyor…")).toBeInTheDocument();
    });
    expect(screen.getByText("Geçen süre: 0 sn")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Raporu üret" })).toBeDisabled();
    expect(screen.getByText(/sayfayı kapatmayın/i)).toBeInTheDocument();
  });
});
