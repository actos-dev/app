/**
 * `SimulationForm` testleri (Faz 5 / Birim 5A.2, U-03, U-06).
 *
 * Doğrulananlar:
 *   - `estimate-cost` yanıtının tahmini maliyet olarak gösterilmesi,
 *   - yetersiz kredide gönderimin BAŞTAN engellenmesi ve nedeninin yazılması,
 *   - çalışma sürerken buton kilidi + dürüst ilerleme metni (sahte yüzde yok),
 *   - başarılı koşuda sonuç render'ı ve geçmiş sorgusunun tazelenmesi (koşu
 *     cevabındaki `remaining_credits` ile kredi güncellenir),
 *   - `error_simulation_failed` → i18n metni (B-07).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SimulationForm } from "@/components/simulation/SimulationForm";
import { qk } from "@/lib/query/keys";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const searchResults = [{ ticker: "ASELS", name: "Aselsan Elektronik", score: 100 }];

const resultPayload = {
  prob_above: 0.72,
  prob_below: 0.28,
  confidence: { min: 90, max: 140, percent: 0.9, days: 30, bounds: "0.05" },
  direction: "above",
  simulation_id: 7,
  ticker: "ASELS",
  days: 30,
  target: "auto",
  bounds: "0.05",
  credits_spend: 0.15,
  remaining_credits: 12.5,
};

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

function renderForm(options: {
  credits: number;
  estimateCost: number;
  perDayCost?: number;
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return {
    client,
    ...renderWithIntl(
      <QueryClientProvider client={client}>
        <SimulationForm
          initialCredits={{ credits: options.credits }}
          initialPerDayCost={{ per_day_cost: options.perDayCost ?? 0.005, round: 3 }}
        />
      </QueryClientProvider>,
    ),
  };
}

/** Sembol aramadan ASELS seçer. */
async function selectSymbol(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByRole("combobox", { name: "Hisse ara" });
  await user.type(input, "AS");
  await screen.findByRole("option", { name: /ASELS/ });
  await user.keyboard("{ArrowDown}");
  await user.keyboard("{Enter}");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SimulationForm — maliyet ve kredi (U-03)", () => {
  it("tahmini maliyeti estimate-cost yanıtından gösterir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/companies/search") return jsonResponse(searchResults);
      if (path.startsWith("/api/v1/simulations/estimate-cost/")) {
        return jsonResponse({ cost: 0.15 });
      }
      return null;
    });
    const user = userEvent.setup();
    renderForm({ credits: 100, estimateCost: 0.15 });

    expect(screen.getByTestId("estimated-cost")).toHaveTextContent("—");

    await selectSymbol(user);

    await waitFor(() => {
      expect(screen.getByTestId("estimated-cost")).toHaveTextContent("0,150");
    });
  });

  it("yetersiz kredide gönderimi engeller ve nedenini açıklar", async () => {
    installFetch((path) => {
      if (path === "/api/v1/companies/search") return jsonResponse(searchResults);
      if (path.startsWith("/api/v1/simulations/estimate-cost/")) {
        return jsonResponse({ cost: 1.85 });
      }
      return null;
    });
    const user = userEvent.setup();
    renderForm({ credits: 0.5, estimateCost: 1.85 });

    await selectSymbol(user);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Yetersiz kredi");
    expect(alert).toHaveTextContent("1,850");
    expect(alert).toHaveTextContent("1");

    const submit = screen.getByRole("button", { name: "Simülasyonu çalıştır" });
    expect(submit).toBeDisabled();
    expect(calls.some((call) => call.path === "/api/v1/simulations/ASELS")).toBe(false);
  });
});

describe("SimulationForm — senkron çalışma (U-06)", () => {
  it("çalışma sürerken butonu kilitler ve ilerleme metni gösterir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/companies/search") return jsonResponse(searchResults);
      if (path.startsWith("/api/v1/simulations/estimate-cost/")) {
        return jsonResponse({ cost: 0.15 });
      }
      if (path === "/api/v1/simulations/ASELS") {
        // Yanıt hiç gelmez: istek asılı kalır (senkron dakikalar benzetimi).
        return new Promise<Response>(() => {}) as unknown as Response;
      }
      return null;
    });
    const user = userEvent.setup();
    renderForm({ credits: 100, estimateCost: 0.15 });

    await selectSymbol(user);
    await user.click(screen.getByRole("button", { name: "Simülasyonu çalıştır" }));

    await waitFor(() => {
      expect(screen.getByText("Simülasyon çalışıyor…")).toBeInTheDocument();
    });
    expect(screen.getByText("Geçen süre: 0 sn")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simülasyonu çalıştır" })).toBeDisabled();
    expect(screen.getByText(/sayfayı kapatmayın/i)).toBeInTheDocument();
    expect(screen.getByText(/iptal edilemez/i)).toBeInTheDocument();
  });

  it("başarılı koşuda sonucu render eder ve geçmişi tazeler", async () => {
    installFetch((path) => {
      if (path === "/api/v1/companies/search") return jsonResponse(searchResults);
      if (path.startsWith("/api/v1/simulations/estimate-cost/")) {
        return jsonResponse({ cost: 0.15 });
      }
      if (path === "/api/v1/simulations/ASELS") return jsonResponse(resultPayload);
      return null;
    });
    const user = userEvent.setup();
    const { client } = renderForm({ credits: 100, estimateCost: 0.15 });

    // Geçmiş önbelleğini tohumla ki invalidation gözlemlenebilsin.
    client.setQueryData(qk.simulations.list(), []);
    expect(client.getQueryState(qk.simulations.list())?.isInvalidated).toBe(false);

    await selectSymbol(user);
    await user.click(screen.getByRole("button", { name: "Simülasyonu çalıştır" }));

    const result = await screen.findByTestId("simulation-result");
    expect(result).toHaveTextContent("%72");
    expect(result).toHaveTextContent("ASELS");
    expect(result).toHaveTextContent("90,00");
    expect(result).toHaveTextContent("140,00");

    // Koşu yanıtındaki `remaining_credits` kredi önbelleğine yazılır (U-03).
    await waitFor(() => {
      expect(client.getQueryData(qk.credits())).toEqual({ credits: 12.5 });
    });
    // Geçmiş sorgusu tazelenir (invalidateQueries → isInvalidated true).
    await waitFor(() => {
      expect(client.getQueryState(qk.simulations.list())?.isInvalidated).toBe(true);
    });
  });

  it("error_simulation_failed hatasını i18n metnine çevirir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/companies/search") return jsonResponse(searchResults);
      if (path.startsWith("/api/v1/simulations/estimate-cost/")) {
        return jsonResponse({ cost: 0.15 });
      }
      if (path === "/api/v1/simulations/ASELS") {
        return jsonResponse({ detail: "error_simulation_failed" }, 500);
      }
      return null;
    });
    const user = userEvent.setup();
    renderForm({ credits: 100, estimateCost: 0.15 });

    await selectSymbol(user);
    await user.click(screen.getByRole("button", { name: "Simülasyonu çalıştır" }));

    await waitFor(() => {
      expect(screen.queryByTestId("simulation-result")).not.toBeInTheDocument();
    });
    const alerts = await screen.findAllByRole("alert");
    const joined = alerts.map((node) => node.textContent ?? "").join(" ");
    // `error_simulation_failed` → apiErrors.simulationFailed metni.
    expect(joined).toContain("Simülasyon tamamlanamadı");
    expect(joined).toContain("Kredi iade edildi");
  });
});

describe("SimulationForm — bakım modu", () => {
  it("maintenance listesinde simülasyon varsa gönderimi kilitler", async () => {
    installFetch((path) => {
      if (path === "/api/v1/companies/search") return jsonResponse(searchResults);
      if (path === "/api/v1/maintenance") return jsonResponse({ disabled_features: ["simulation"] });
      if (path.startsWith("/api/v1/simulations/estimate-cost/")) {
        return jsonResponse({ cost: 0.15 });
      }
      return null;
    });
    const user = userEvent.setup();
    renderForm({ credits: 100, estimateCost: 0.15 });

    expect(await screen.findByText("Simülasyon bakımda")).toBeInTheDocument();

    await selectSymbol(user);
    expect(screen.getByRole("button", { name: "Simülasyonu çalıştır" })).toBeDisabled();
    expect(calls.some((call) => call.path === "/api/v1/simulations/ASELS")).toBe(false);
  });
});
