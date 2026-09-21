/**
 * `CommandPalette` testleri (Faz 5 / Birim 5B.4, U-10, A-02).
 *
 * Doğrulananlar: ⌘K ile açma/kapatma, sayfa ve işlem filtreleme, Enter ile
 * işlem çalıştırma, Escape sonrası odağın tetikleyiciye dönmesi, sembol
 * aramasının (mock) sonuç göstermesi ve ARIA (dialog + aktive descendant)
 * nitelikleri.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "@/components/shared/CommandPalette";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";
import type { CompanySearchResult } from "@/types/market";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  setTheme: vi.fn(),
  setLocale: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, refresh: mocks.refresh }),
}));

vi.mock("@/i18n/actions", () => ({
  setTheme: mocks.setTheme,
  setLocale: mocks.setLocale,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function installFetch(results: CompanySearchResult[] = []): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const path = new URL(String(input), "http://localhost").pathname;
      if (path === "/api/v1/companies/search") {
        return mockResponse(results);
      }
      return mockResponse({ detail: "not found" }, 404);
    }),
  );
}

function renderPalette() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <CommandPalette theme="dark" />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  mocks.push.mockReset();
  mocks.replace.mockReset();
  mocks.refresh.mockReset();
  mocks.setTheme.mockReset();
  mocks.setLocale.mockReset();
});

describe("CommandPalette", () => {
  it("topbar tetikleyicisini kısayol ipucuyla render eder", () => {
    installFetch();
    renderPalette();

    expect(screen.getByRole("button", { name: "Komut paletini aç" })).toBeInTheDocument();
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("⌘K ile açar ve odağı arama alanına verir", async () => {
    installFetch();
    renderPalette();

    fireEvent.keyDown(window, { key: "k", metaKey: true });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
    expect(screen.getByRole("listbox", { name: "Komutlar" })).toBeInTheDocument();
  });

  it("sayfaları sorguya göre filtreler", async () => {
    installFetch();
    const user = userEvent.setup();
    renderPalette();

    await user.click(screen.getByRole("button", { name: "Komut paletini aç" }));
    await user.type(await screen.findByRole("combobox"), "portföy");

    expect(screen.getByRole("option", { name: /Portföyler/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Piyasalar/ })).not.toBeInTheDocument();
  });

  it("Enter ile seçili işlemi çalıştırır (tema değişimi)", async () => {
    installFetch();
    const user = userEvent.setup();
    renderPalette();

    await user.click(screen.getByRole("button", { name: "Komut paletini aç" }));
    await user.type(await screen.findByRole("combobox"), "açık");
    await user.keyboard("{Enter}");

    expect(mocks.setTheme).toHaveBeenCalledWith("light");
  });

  it("Escape ile kapanır ve odak tetikleyiciye döner", async () => {
    installFetch();
    const user = userEvent.setup();
    renderPalette();

    const trigger = screen.getByRole("button", { name: "Komut paletini aç" });
    await user.click(trigger);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("sembol aramasında sunucu sonuçlarını gösterir", async () => {
    installFetch([{ ticker: "THYAO", name: "Türk Hava Yolları", score: 1 }]);
    const user = userEvent.setup();
    renderPalette();

    await user.click(screen.getByRole("button", { name: "Komut paletini aç" }));
    await user.type(await screen.findByRole("combobox"), "THY");

    expect(
      await screen.findByRole("option", { name: /THYAO/ }, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it("combobox'ı aktive descendant ile ilişkilendirir", async () => {
    installFetch();
    renderPalette();

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    const combobox = await screen.findByRole("combobox");

    expect(combobox).toHaveAttribute("aria-activedescendant", "command-option-0");
    expect(combobox).toHaveAttribute("aria-controls", "command-listbox");
  });
});
