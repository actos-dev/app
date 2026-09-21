/**
 * Botlar sekmesi testleri (Faz 5 / Birim 5B.3).
 *
 * Doğrulananlar: liste render'ı + limit göstergesi, oluşturma doğrulaması
 * (zod; boş kullanıcı adı POST atmaz), başarılı oluşturmada tek seferlik
 * şifre gösterimi, onaylı silme ve backend limit hatasının i18n toast'ı.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeAll, beforeEach, afterAll, describe, expect, it, vi } from "vitest";

import { BotsTab } from "@/components/profile/BotsTab";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

// jsdom öğe boyutlarını 0 döndürür; sanallaştırıcı satırları çizebilsin diye
// sabit yükseklik/genişlik taklit edilir (markets-tables testiyle aynı desen).
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

type FetchCall = { path: string; method: string; body: unknown };

let calls: FetchCall[] = [];

function installFetch(handler: (path: string, method: string) => Response | null) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input), "http://localhost").pathname;
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({
        path,
        method,
        body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
      });
      const response = handler(path, method);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

const bots = [
  {
    id: 1,
    username: "alpha",
    created_at: "2026-02-01T10:00:00Z",
    last_login: null,
  },
];

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <BotsTab />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  calls = [];
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BotsTab — liste", () => {
  it("botları ve limit göstergesini render eder", async () => {
    installFetch((path) => {
      if (path === "/api/v1/bots") return mockResponse({ bots });
      return null;
    });

    renderTab();

    expect(await screen.findByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("1/5 bot kullanılıyor.")).toBeInTheDocument();
    expect(screen.getByText("Hiç")).toBeInTheDocument();
  });

  it("limit doluyken oluşturma butonunu kapatır", async () => {
    const full = Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      username: `bot${index + 1}`,
      created_at: null,
      last_login: null,
    }));
    installFetch((path) => {
      if (path === "/api/v1/bots") return mockResponse({ bots: full });
      return null;
    });

    renderTab();

    await screen.findByText("bot1");
    expect(screen.getByRole("button", { name: "Yeni bot" })).toBeDisabled();
  });
});

describe("BotsTab — oluşturma", () => {
  it("boş kullanıcı adıyla POST atmaz ve doğrulama hatası gösterir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/bots") return mockResponse({ bots });
      return null;
    });
    const user = userEvent.setup();
    renderTab();

    await screen.findByText("alpha");
    await user.click(screen.getByRole("button", { name: "Yeni bot" }));
    await user.click(screen.getByRole("button", { name: "Bot oluştur" }));

    expect(await screen.findByText("Kullanıcı adı en az 3 karakter olmalı.")).toBeInTheDocument();
    expect(calls.some((call) => call.method === "POST")).toBe(false);
  });

  it("oluşturur ve tek seferlik şifreyi gösterir", async () => {
    installFetch((path, method) => {
      if (path === "/api/v1/bots" && method === "GET") return mockResponse({ bots });
      if (path === "/api/v1/bots" && method === "POST") {
        return mockResponse(
          {
            id: 2,
            username: "mybot",
            email: "mybot@bot.florencex.com.tr",
            password: "s3cret-passphrase",
          },
          200,
        );
      }
      return null;
    });
    const user = userEvent.setup();
    renderTab();

    await screen.findByText("alpha");
    await user.click(screen.getByRole("button", { name: "Yeni bot" }));
    await user.type(screen.getByLabelText("Kullanıcı adı"), "mybot");
    await user.click(screen.getByRole("button", { name: "Bot oluştur" }));

    await waitFor(() => {
      const call = calls.find((item) => item.method === "POST");
      expect(call?.body).toEqual({ username: "mybot" });
    });
    expect(await screen.findByDisplayValue("mybot@bot.florencex.com.tr")).toBeInTheDocument();
    expect(screen.getByDisplayValue("s3cret-passphrase")).toBeInTheDocument();
  });

  it("backend limit hatasını i18n toast'ına çevirir", async () => {
    installFetch((path, method) => {
      if (path === "/api/v1/bots" && method === "GET") return mockResponse({ bots });
      if (path === "/api/v1/bots" && method === "POST") {
        return mockResponse({ detail: "error_bot_limit_reached" }, 400);
      }
      return null;
    });
    const user = userEvent.setup();
    renderTab();

    await screen.findByText("alpha");
    await user.click(screen.getByRole("button", { name: "Yeni bot" }));
    await user.type(screen.getByLabelText("Kullanıcı adı"), "mybot");
    await user.click(screen.getByRole("button", { name: "Bot oluştur" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Bot limitine ulaştın.");
    });
  });
});

describe("BotsTab — silme", () => {
  it("onay ister ve DELETE gönderir", async () => {
    installFetch((path, method) => {
      if (path === "/api/v1/bots" && method === "GET") return mockResponse({ bots });
      if (path === "/api/v1/bots/1" && method === "DELETE") return mockResponse({ message: "ok" });
      return null;
    });
    const user = userEvent.setup();
    renderTab();

    await screen.findByText("alpha");
    await user.click(screen.getByRole("button", { name: "Sil" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/alpha/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Botu sil" }));

    await waitFor(() => {
      expect(calls.some((call) => call.path === "/api/v1/bots/1" && call.method === "DELETE")).toBe(
        true,
      );
    });
  });
});
