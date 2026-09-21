/**
 * Güvenlik sekmesi testleri (Faz 5 / Birim 5B.2, S-07, A-01, A-03).
 *
 * Şifre doğrulaması (min uzunluk, eşleşme), başarılı değişim ve iki adımlı
 * hesap silme onayı (kullanıcı adını yazma → DELETE + çıkış + `/`e
 * yönlendirme) doğrulanır. `next/navigation` ve `fetch` mock'lanır.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SecurityTab } from "@/components/profile/SecurityTab";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks,
}));

type FetchCall = { path: string; method: string; body: unknown };

let calls: FetchCall[] = [];

function installFetch(handler: (path: string, method: string) => Response) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input), "http://localhost").pathname;
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ path, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return handler(path, method);
    }),
  );
}

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <SecurityTab username="efe" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  calls = [];
  mocks.replace.mockReset();
  mocks.refresh.mockReset();
  mocks.push.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SecurityTab — şifre", () => {
  it("eşleşmeyen şifrede hata gösterir ve istek atmaz", async () => {
    installFetch(() => mockResponse({}));
    const user = userEvent.setup();
    renderTab();

    await user.type(screen.getByLabelText("Mevcut şifre"), "secret12345");
    await user.type(screen.getByLabelText("Yeni şifre"), "abcdefghij");
    await user.type(screen.getByLabelText("Yeni şifre (tekrar)"), "farkli");
    await user.click(screen.getByRole("button", { name: "Şifreyi güncelle" }));

    expect(await screen.findByText("Şifreler eşleşmiyor.")).toBeInTheDocument();
    expect(calls.some((call) => call.method === "PUT")).toBe(false);
  });

  it("kısa şifrede min uzunluk hatası gösterir", async () => {
    installFetch(() => mockResponse({}));
    const user = userEvent.setup();
    renderTab();

    await user.type(screen.getByLabelText("Mevcut şifre"), "secret12345");
    await user.type(screen.getByLabelText("Yeni şifre"), "kisa");
    await user.type(screen.getByLabelText("Yeni şifre (tekrar)"), "kisa");
    await user.click(screen.getByRole("button", { name: "Şifreyi güncelle" }));

    expect(await screen.findByText("Şifre en az 10 karakter olmalı.")).toBeInTheDocument();
    expect(calls.some((call) => call.method === "PUT")).toBe(false);
  });

  it("geçerli şifrede PUT atar, başarı ve yeniden giriş eylemi gösterir", async () => {
    installFetch(() => mockResponse({ message: "Password changed successfully" }));
    const user = userEvent.setup();
    renderTab();

    const newPassword = screen.getByLabelText("Yeni şifre");
    expect(newPassword).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Mevcut şifre")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );

    await user.type(screen.getByLabelText("Mevcut şifre"), "secret12345");
    await user.type(newPassword, "yeniSifre123");
    await user.type(screen.getByLabelText("Yeni şifre (tekrar)"), "yeniSifre123");
    await user.click(screen.getByRole("button", { name: "Şifreyi güncelle" }));

    await waitFor(() => {
      const call = calls.find((item) => item.path === "/api/v1/auth/change-password");
      expect(call?.method).toBe("PUT");
      expect(call?.body).toEqual({
        current_password: "secret12345",
        new_password: "yeniSifre123",
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Şifren güncellendi");
    expect(screen.getByRole("button", { name: "Giriş ekranına dön" })).toBeInTheDocument();
  });
});

describe("SecurityTab — hesap silme", () => {
  it("iki adımlı onay ister, yanlış adda silmez, doğru adda DELETE + yönlendirir", async () => {
    installFetch((path, method) => {
      if (path === "/api/v1/auth/delete" && method === "DELETE") {
        return mockResponse({ message: "Deleted user 1" });
      }
      return mockResponse({ message: "Logged out" });
    });
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole("button", { name: "Hesabımı sil" }));

    const dialog = await screen.findByRole("dialog");
    // 1. adım: yalnız uyarı ve devam düğmesi; onay alanı henüz yok.
    expect(within(dialog).queryByLabelText("Onaylamak için kullanıcı adını yaz")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Anladım, devam et" }));

    const confirmInput = within(dialog).getByLabelText("Onaylamak için kullanıcı adını yaz");
    const deleteButton = within(dialog).getByRole("button", { name: "Kalıcı olarak sil" });
    expect(deleteButton).toBeDisabled();

    await user.type(confirmInput, "yanlis");
    expect(deleteButton).toBeDisabled();
    expect(calls.some((call) => call.method === "DELETE")).toBe(false);

    await user.clear(confirmInput);
    await user.type(confirmInput, "efe");
    await waitFor(() => expect(deleteButton).toBeEnabled());
    await user.click(deleteButton);

    await waitFor(() => {
      expect(calls.some((call) => call.method === "DELETE" && call.path === "/api/v1/auth/delete")).toBe(
        true,
      );
    });
    await waitFor(() => {
      expect(calls.some((call) => call.method === "POST" && call.path === "/api/v1/auth/logout")).toBe(
        true,
      );
    });
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/"));
  });
});
