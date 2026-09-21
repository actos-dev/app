/**
 * `AdvisorPortfolioForm` testleri (Faz 5 / Birim 5A.2).
 *
 * Doğrulananlar:
 *   - hisse ekleme/kaldırma ve aynı hissenin iki kez eklenmemesi,
 *   - boş listede gönderimin kilitli olması,
 *   - başarılı sonuçta ortak profil ve benzer hisselerin gösterilmesi.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdvisorPortfolioForm } from "@/components/advisor/AdvisorPortfolioForm";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const searchResults = [
  { ticker: "ASELS", name: "Aselsan Elektronik", score: 100 },
  { ticker: "THYAO", name: "Türk Hava Yolları", score: 90 },
];

const profilePayload = {
  avg_vector: [0.34, 0.71, 0.65],
  estimated_profile: { risk: "medium", horizon: "long", profitability: "high" },
  portfolio: [{ ticker: "ASELS", vector: [0.34, 0.71, 0.65] }],
  similar_stocks: [{ ticker: "KCHOL", vector: [0.3, 0.6, 0.5], score: 0.79, distance: 0.26 }],
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
      <AdvisorPortfolioForm maintenanceBlocked={maintenanceBlocked} />
    </QueryClientProvider>,
  );
}

async function addTicker(user: ReturnType<typeof userEvent.setup>, term: string, ticker: string) {
  const input = screen.getByRole("combobox", { name: "Hisse ara" });
  await user.type(input, term);
  await screen.findByRole("option", { name: new RegExp(ticker) });
  await user.keyboard("{ArrowDown}");
  await user.keyboard("{Enter}");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AdvisorPortfolioForm — hisse seçimi", () => {
  it("boş listede gönderimi kilitler", () => {
    installFetch(() => null);
    renderForm();

    expect(screen.getByText("Henüz hisse eklemedin.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Profili çıkar" })).toBeDisabled();
    expect(calls.some((call) => call.path === "/api/v1/portfolio/profile")).toBe(false);
  });

  it("aynı hisseyi iki kez eklemez", async () => {
    installFetch((path) => (path === "/api/v1/companies/search" ? jsonResponse(searchResults) : null));
    const user = userEvent.setup();
    renderForm();

    await addTicker(user, "AS", "ASELS");
    expect(await screen.findByText("ASELS")).toBeInTheDocument();

    await addTicker(user, "AS", "ASELS");
    expect(await screen.findByText("ASELS zaten listede.")).toBeInTheDocument();
  });
});

describe("AdvisorPortfolioForm — profil sonucu", () => {
  it("başarılı sonuçta profili ve benzer hisseleri gösterir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/companies/search") return jsonResponse(searchResults);
      if (path === "/api/v1/portfolio/profile") return jsonResponse(profilePayload);
      return null;
    });
    const user = userEvent.setup();
    renderForm();

    await addTicker(user, "AS", "ASELS");
    const submit = screen.getByRole("button", { name: "Profili çıkar" });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    expect(await screen.findByText("Ortalama profil")).toBeInTheDocument();
    expect(screen.getByText("Benzer hisseler")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "KCHOL" })).toHaveAttribute("href", "/symbol/KCHOL");

    await waitFor(() => {
      const call = calls.find((item) => item.path === "/api/v1/portfolio/profile");
      expect(call?.method).toBe("POST");
      expect(call?.body).toMatchObject({ tickers: ["ASELS"], limit: 5 });
    });
  });
});
