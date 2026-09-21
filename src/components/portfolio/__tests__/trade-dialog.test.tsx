/**
 * Al/sat diyaloğu testleri (Faz 4 / Birim 4.2, U-04, U-05, P-02).
 *
 * Doğrulananlar:
 *   - diyalog açılışında YALNIZ tek fiyat isteği,
 *   - komisyon/toplam hesabı (ALIŞ ekler, SATIŞ düşürür),
 *   - doğrulama ve elde olandan fazla SATIŞ engeli,
 *   - seans kapalıyken gönderimin BAŞTAN engeli + gerekçe metni,
 *   - backend `error_market_closed` → i18n mesajı,
 *   - başarıda portföy sorgularının invalidate edilmesi.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TradeDialog } from "@/components/portfolio/TradeDialog";
import { qk } from "@/lib/query/keys";
import { renderWithIntl } from "@/test/test-utils";
import type { MarketStatus } from "@/types/market";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const { toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

const openStatus: MarketStatus = {
  open: true,
  next_open_at: null,
  timezone: "Europe/Istanbul",
  is_holiday: false,
  holiday_name: null,
  as_of: "2026-09-21T08:00:00Z",
};

const closedStatus: MarketStatus = {
  open: false,
  next_open_at: "2026-09-22T07:00:00Z",
  timezone: "Europe/Istanbul",
  is_holiday: false,
  holiday_name: null,
  as_of: "2026-09-21T18:30:00Z",
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

function countPath(path: string): number {
  return calls.filter((call) => call.path === path).length;
}

function priceResponse(price: number): Response {
  return jsonResponse({
    ticker: "THYAO",
    price,
    previous_close: price,
    absolute_change: 0,
    change_pct: 0,
    as_of: "2026-09-21T08:00:00Z",
    previous_close_as_of: null,
    market_status: "open",
    is_stale: false,
    change_window: "last_session_change",
    interval: "5m",
  });
}

type RenderOptions = {
  type?: "BUY" | "SELL";
  marketStatus?: MarketStatus;
  holdings?: Record<string, number>;
  cashBalance?: number | null;
  initialTicker?: string;
};

function renderDialog(options: RenderOptions = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  const invalidateSpy = vi.spyOn(client, "invalidateQueries");
  const ui: ReactElement = (
    <TradeDialog
      portfolioId="port-1"
      initialType={options.type ?? "BUY"}
      {...(options.initialTicker !== undefined
        ? { initialTicker: options.initialTicker }
        : {})}
      marketStatus={options.marketStatus ?? openStatus}
      holdings={options.holdings ?? {}}
      cashBalance={options.cashBalance ?? 100000}
      open
      onOpenChange={() => {}}
    />
  );
  const result = renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return { ...result, invalidateSpy };
}

afterEach(() => {
  vi.unstubAllGlobals();
  toastErrorMock.mockClear();
  toastSuccessMock.mockClear();
});

describe("TradeDialog — fiyat ve komisyon", () => {
  it("açılışta yalnız tek fiyat isteği atar", async () => {
    installFetch((path) => (path === "/api/v1/price/current" ? priceResponse(100) : null));

    renderDialog({ initialTicker: "THYAO" });

    expect(await screen.findByText("100,00")).toBeInTheDocument();
    expect(countPath("/api/v1/price/current")).toBe(1);
  });

  it("ALIŞ'ta komisyonu ekleyip toplamı gösterir", async () => {
    const user = userEvent.setup();
    installFetch((path, method) => {
      if (path === "/api/v1/price/current") return priceResponse(100);
      if (path === "/api/v1/portfolios/port-1/transactions" && method === "POST") {
        return jsonResponse({ message: "Transaction added" });
      }
      return null;
    });

    const { invalidateSpy } = renderDialog({ initialTicker: "THYAO" });

    await screen.findByText("100,00");
    await user.type(screen.getByLabelText("Adet"), "10");

    expect(screen.getByText("1.000,00")).toBeInTheDocument();
    expect(screen.getByText("1,00")).toBeInTheDocument();
    expect(screen.getByText("1.001,00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Alış emrini gönder" }));

    await waitFor(() => {
      expect(
        calls.some(
          (call) => call.method === "POST" && call.path === "/api/v1/portfolios/port-1/transactions",
        ),
      ).toBe(true);
    });
    const post = calls.find((call) => call.method === "POST");
    expect(post?.body).toEqual({ ticker: "THYAO", type: "BUY", quantity: 10 });
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.portfolios() }),
    );
  });

  it("SATIŞ'ta komisyonu hasılattan düşer", async () => {
    const user = userEvent.setup();
    installFetch((path) => (path === "/api/v1/price/current" ? priceResponse(100) : null));

    renderDialog({ initialTicker: "THYAO", type: "SELL", holdings: { THYAO: 10 } });

    await screen.findByText("100,00");
    await user.type(screen.getByLabelText("Adet"), "10");

    expect(screen.getByText("999,00")).toBeInTheDocument();
  });
});

describe("TradeDialog — doğrulama", () => {
  it("sembol seçilmeden gönderim yapmaz ve hata gösterir", async () => {
    const user = userEvent.setup();
    installFetch(() => null);

    renderDialog();

    await user.click(screen.getByRole("button", { name: "Alış emrini gönder" }));

    expect(screen.getByText("Sembol seç.")).toBeInTheDocument();
    expect(calls.some((call) => call.method === "POST")).toBe(false);
  });

  it("SATIŞ'ta elde olandan fazla adedi engeller", async () => {
    const user = userEvent.setup();
    installFetch((path) => (path === "/api/v1/price/current" ? priceResponse(100) : null));

    renderDialog({ initialTicker: "THYAO", type: "SELL", holdings: { THYAO: 5 } });

    await screen.findByText("100,00");
    await user.type(screen.getByLabelText("Adet"), "10");

    expect(screen.getByText("Elde en fazla 5 adet var.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Satış emrini gönder" })).toBeDisabled();
  });

  it("ALIŞ'ta yetersiz nakdi engeller", async () => {
    const user = userEvent.setup();
    installFetch((path) => (path === "/api/v1/price/current" ? priceResponse(100) : null));

    renderDialog({ initialTicker: "THYAO", cashBalance: 500 });

    await screen.findByText("100,00");
    await user.type(screen.getByLabelText("Adet"), "10");

    expect(screen.getByText("Yetersiz nakit. Gereken: 1.001,00.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alış emrini gönder" })).toBeDisabled();
  });
});

describe("TradeDialog — seans kapısı (U-04)", () => {
  it("piyasa kapalıyken gönderimi baştan engeller ve gerekçeyi gösterir", async () => {
    const user = userEvent.setup();
    installFetch((path) => (path === "/api/v1/price/current" ? priceResponse(100) : null));

    renderDialog({ initialTicker: "THYAO", marketStatus: closedStatus });

    await screen.findByText("100,00");
    await user.type(screen.getByLabelText("Adet"), "10");

    expect(screen.getByText(/Sonraki açılış:/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alış emrini gönder" })).toBeDisabled();
    expect(calls.some((call) => call.method === "POST")).toBe(false);
  });

  it("resmî tatilde tatil adını gerekçe olarak gösterir", async () => {
    installFetch((path) => (path === "/api/v1/price/current" ? priceResponse(100) : null));

    renderDialog({
      initialTicker: "THYAO",
      marketStatus: { ...closedStatus, is_holiday: true, holiday_name: "Zafer Bayramı" },
    });

    expect(await screen.findByText(/resmî tatil: Zafer Bayramı/)).toBeInTheDocument();
  });

  it("backend error_market_closed dönerse i18n mesajını gösterir", async () => {
    const user = userEvent.setup();
    installFetch((path, method) => {
      if (path === "/api/v1/price/current") return priceResponse(100);
      if (path === "/api/v1/portfolios/port-1/transactions" && method === "POST") {
        return jsonResponse({ detail: "error_market_closed" }, 400);
      }
      return null;
    });

    renderDialog({ initialTicker: "THYAO" });

    await screen.findByText("100,00");
    await user.type(screen.getByLabelText("Adet"), "10");
    await user.click(screen.getByRole("button", { name: "Alış emrini gönder" }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("Piyasa kapalı."));
    expect(await screen.findByRole("alert")).toHaveTextContent("Piyasa kapalı.");
  });
});
