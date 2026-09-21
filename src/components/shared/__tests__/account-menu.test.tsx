/**
 * `AccountMenu` testleri (Faz 5 / Birim 5A.3, U-11, A-02).
 *
 * Klavye ile açılma, tema/dil seçimi ve çıkış akışı (POST + query önbelleği
 * temizliği + `/login` yönlendirmesi) doğrulanır.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountMenu } from "@/components/shared/AccountMenu";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  setTheme: vi.fn(),
  setLocale: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh, push: mocks.push }),
}));

vi.mock("@/i18n/actions", () => ({
  setTheme: mocks.setTheme,
  setLocale: mocks.setLocale,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

type FetchCall = { path: string; method: string };

let calls: FetchCall[] = [];

function installFetch() {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input), "http://localhost").pathname;
      calls.push({ path, method: (init?.method ?? "GET").toUpperCase() });
      if (path === "/api/v1/credits") {
        return mockResponse({ credits: 10 });
      }
      return mockResponse({ message: "Logged out" });
    }),
  );
}

function renderMenu() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  client.setQueryData(["sentinel"], 1);
  const view = renderWithIntl(
    <QueryClientProvider client={client}>
      <AccountMenu theme="dark" initialCredits={10} />
    </QueryClientProvider>,
  );
  return { client, ...view };
}

afterEach(() => {
  vi.unstubAllGlobals();
  mocks.replace.mockReset();
  mocks.refresh.mockReset();
  mocks.push.mockReset();
  mocks.setTheme.mockReset();
  mocks.setLocale.mockReset();
});

describe("AccountMenu", () => {
  it("klavyeyle açılır ve menü öğelerini gösterir", async () => {
    installFetch();
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: "Hesap menüsü" });
    trigger.focus();
    await user.keyboard("{Enter}");

    const menu = await screen.findByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Profil" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Çıkış yap" })).toBeInTheDocument();
  });

  it("çıkışta POST atar, önbelleği temizler ve /login'e yönlendirir", async () => {
    installFetch();
    const user = userEvent.setup();
    const { client } = renderMenu();

    await user.click(screen.getByRole("button", { name: "Hesap menüsü" }));
    await user.click(await screen.findByRole("menuitem", { name: "Çıkış yap" }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));

    expect(
      calls.some((call) => call.method === "POST" && call.path === "/api/v1/auth/logout"),
    ).toBe(true);
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
  });

  it("tema seçimi server action'ı çağırır", async () => {
    installFetch();
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Hesap menüsü" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Açık" }));

    await waitFor(() => expect(mocks.setTheme).toHaveBeenCalledWith("light"));
  });
});
