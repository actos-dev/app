/**
 * Son işlemi geri alma onayı testleri (Faz 4 / Birim 4.2, U-05).
 *
 * Doğrulananlar: onay diyaloğunun hangi işlemin silineceğini göstermesi ve
 * onayda `DELETE /portfolios/{id}/transactions/undo` çağrılması; vazgeçmede
 * istek atılmaması.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UndoTransactionDialog } from "@/components/portfolio/UndoTransactionDialog";
import { renderWithIntl } from "@/test/test-utils";
import type { PortfolioTransaction } from "@/lib/portfolio/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const transaction: PortfolioTransaction = {
  id: "tx-9",
  ticker: "THYAO",
  type: "BUY",
  quantity: 10,
  price: 300,
  commission: 3,
  total: 3003,
  date: "2026-08-15T08:00:00Z",
};

type FetchCall = { path: string; method: string };

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
      calls.push({ path, method });
      const response = handler(path, method);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

function renderDialog(onOpenChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  const ui: ReactElement = (
    <UndoTransactionDialog
      portfolioId="port-1"
      transaction={transaction}
      open
      onOpenChange={onOpenChange}
    />
  );
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("UndoTransactionDialog", () => {
  it("hangi işlemin silineceğini açıkça gösterir", () => {
    installFetch(() => null);

    renderDialog();

    expect(screen.getByText(/Alış THYAO/)).toBeInTheDocument();
    expect(screen.getByText(/10 adet/)).toBeInTheDocument();
  });

  it("onayda DELETE .../transactions/undo atar", async () => {
    const user = userEvent.setup();
    installFetch((path, method) => {
      if (path === "/api/v1/portfolios/port-1/transactions/undo" && method === "DELETE") {
        return new Response(JSON.stringify({ message: "Last transaction undone" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return null;
    });

    renderDialog();
    await user.click(screen.getByRole("button", { name: "Geri al" }));

    await waitFor(() => {
      expect(
        calls.some(
          (call) =>
            call.method === "DELETE" &&
            call.path === "/api/v1/portfolios/port-1/transactions/undo",
        ),
      ).toBe(true);
    });
  });

  it("vazgeçmede istek atmaz", async () => {
    const user = userEvent.setup();
    installFetch(() => null);

    renderDialog();
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(calls.length).toBe(0);
  });
});
