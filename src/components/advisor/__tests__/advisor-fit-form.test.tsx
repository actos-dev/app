/**
 * `AdvisorFitForm` testleri (Faz 5 / Birim 5A.2).
 *
 * Doğrulananlar:
 *   - "Analiz et" öncesi hiç istek atılmaması (kredi harcanmadığı bilgisinin
 *     gösterilmesi),
 *   - başarılı sonuçta önerilerin ve sembol bağlantısının render edilmesi,
 *   - bakım modunda (`503`) net durum mesajı; "sessiz başarısızlık" olmaması,
 *   - gönderilen gövdenin backend `FitRequest` şemasıyla uyumu.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdvisorFitForm } from "@/components/advisor/AdvisorFitForm";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Aksiyon kapısı (`useRequireAuth`) `useRouter` çağırır; provider'sız testte
// oturum kapısı uygulanmaz ama router hook'u yine de gerekir.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const fitPayload = {
  query: { horizon_target: 0.7, profitability_target: 0.7, risk_tolerance: 0.5 },
  results: [
    { ticker: "ASELS", vector: [0.3, 0.8, 0.7], score: 0.82, distance: 0.22 },
    { ticker: "THYAO", vector: [0.4, 0.5, 0.4], score: 0.55, distance: 0.82 },
  ],
};

type FetchCall = { path: string; method: string; body: unknown };

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
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      calls.push({ path, method, body });
      const response = handler(path, method);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

function renderForm(maintenanceBlocked = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <AdvisorFitForm maintenanceBlocked={maintenanceBlocked} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AdvisorFitForm — profil ve sonuç", () => {
  it("analiz öncesi istek atmaz ve kredi harcamadığını belirtir", () => {
    installFetch(() => null);
    renderForm();

    expect(screen.getByText("Bu analiz kredi harcamaz.")).toBeInTheDocument();
    expect(calls.some((call) => call.path === "/api/v1/stocks/fit")).toBe(false);
  });

  it("başarılı sonuçta önerileri ve sembol bağlantısını gösterir", async () => {
    installFetch((path) => (path === "/api/v1/stocks/fit" ? jsonResponse(fitPayload) : null));
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Analiz et" }));

    expect(await screen.findByText("2 hisse bulundu")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "ASELS" });
    expect(link).toHaveAttribute("href", "/symbol/ASELS");
    expect(screen.getAllByText("%82").length).toBeGreaterThan(0);

    // Gövde backend `FitRequest` şemasıyla uyumlu (snake_case `risk_tolerance`).
    const call = calls.find((item) => item.path === "/api/v1/stocks/fit");
    expect(call?.method).toBe("POST");
    expect(call?.body).toMatchObject({
      horizon: "long",
      profitability: "high",
      risk_tolerance: "medium",
      limit: 5,
    });
  });
});

describe("AdvisorFitForm — bakım modu", () => {
  it("bakımda butonu kilitler", () => {
    installFetch(() => null);
    renderForm(true);

    const submit = screen.getByRole("button", { name: "Analiz et" });
    expect(submit).toBeDisabled();
    expect(calls.some((call) => call.path === "/api/v1/stocks/fit")).toBe(false);
  });

  it("istek 503 dönerse bakım durumunu gösterir", async () => {
    installFetch((path) =>
      path === "/api/v1/stocks/fit"
        ? jsonResponse({ detail: "advisor is temporarily disabled for maintenance" }, 503)
        : null,
    );
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Analiz et" }));

    await waitFor(() => {
      expect(screen.getByText("Analiz tamamlanamadı")).toBeInTheDocument();
    });
    expect(screen.getByText(/geçici olarak devre dışı/i)).toBeInTheDocument();
  });
});
