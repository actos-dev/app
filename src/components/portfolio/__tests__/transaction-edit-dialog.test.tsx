/**
 * İşlem fiyat düzeltme diyaloğu testleri (Faz 4 / Birim 4.2, U-05).
 *
 * Doğrulananlar: geçersiz fiyatta PUT atılmaması ve hata metni; geçerli
 * değerde `PUT /portfolios/{id}/transactions/{tx_id}` gövdesi.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TransactionEditDialog } from "@/components/portfolio/TransactionEditDialog";
import { renderWithIntl } from "@/test/test-utils";
import type { PortfolioTransaction } from "@/lib/portfolio/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const transaction: PortfolioTransaction = {
  id: "tx-1",
  ticker: "THYAO",
  type: "BUY",
  quantity: 10,
  price: 300,
  commission: 3,
  total: 3003,
  date: "2026-08-15T08:00:00Z",
};

type FetchCall = { path: string; method: string; body: unknown };

let calls: FetchCall[] = [];

function installFetch(handler: (path: string, method: string) => Response | null) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const raw =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(raw, "http://localhost").pathname;
      const method = (init?.method ?? "GET").toUpperCase();
      let body: unknown = null;
      if (typeof init?.body === "string") {
        try {
          body = JSON.parse(init.body);
        } catch {
          body = init.body;
        }
      }
      calls.push({ path, method, body });
      const response = handler(path, method);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

function renderDialog() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  const ui: ReactElement = (
    <TransactionEditDialog
      portfolioId="port-1"
      transaction={transaction}
      open
      onOpenChange={() => {}}
    />
  );
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TransactionEditDialog", () => {
  it("geçersiz fiyatta PUT atmaz ve hata gösterir", async () => {
    const user = userEvent.setup();
    installFetch(() => null);

    renderDialog();

    const priceInput = screen.getByLabelText("Birim fiyat");
    await user.clear(priceInput);
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(screen.getByText("Birim fiyat gerekli.")).toBeInTheDocument();
    expect(calls.some((call) => call.method === "PUT")).toBe(false);
  });

  it("geçerli değerde PUT ile fiyat/adet gönderir", async () => {
    const user = userEvent.setup();
    installFetch((path, method) => {
      if (path === "/api/v1/portfolios/port-1/transactions/tx-1" && method === "PUT") {
        return new Response(JSON.stringify({ message: "Transaction updated" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return null;
    });

    renderDialog();

    const priceInput = screen.getByLabelText("Birim fiyat");
    await user.clear(priceInput);
    await user.type(priceInput, "320");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(
        calls.some(
          (call) =>
            call.method === "PUT" &&
            call.path === "/api/v1/portfolios/port-1/transactions/tx-1",
        ),
      ).toBe(true);
    });
    const put = calls.find((call) => call.method === "PUT");
    expect(put?.body).toEqual({ price: 320, quantity: 10 });
  });
});
