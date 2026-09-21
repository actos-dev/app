/**
 * Hesap sekmesi testleri (Faz 5 / Birim 5B.2, U-11, A-01, A-03).
 *
 * Kullanıcı adı/e-posta güncelleme, backend hata kodu eşlemesi, avatar seçimi
 * ve autocomplete nitelikleri doğrulanır. `fetch` mock'lanır; RSC verisi
 * `initialData` ile tohumlandığı için mount'ta ek GET olmaz.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountTab } from "@/components/profile/AccountTab";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

const profile = {
  username: "efe",
  email: "efe@example.com",
  user_type: "user",
  created_at: "2026-01-02T10:00:00Z",
  email_verified: true,
  avatar_id: "avatar-1",
  credits: 20,
};

const avatars = [
  { id: "avatar-1", url: "/avatars/avatar-1.svg" },
  { id: "avatar-2", url: "/avatars/avatar-2.svg" },
];

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
      <AccountTab profile={profile} avatars={avatars} />
    </QueryClientProvider>,
  );
}

/** Başlık metnine göre form kapsamı (aynı "Mevcut şifre" etiketi iki formda var). */
function formFor(submitLabel: string): HTMLFormElement {
  const button = screen.getByRole("button", { name: submitLabel });
  const form = button.closest("form");
  if (!form) {
    throw new Error(`form bulunamadı: ${submitLabel}`);
  }
  return form;
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AccountTab — kullanıcı adı", () => {
  it("güncelleme gönderir ve başarı mesajı gösterir", async () => {
    installFetch(() => mockResponse({ message: "ok", new_username: "yenigun" }));
    const user = userEvent.setup();
    renderTab();

    const form = within(formFor("Kullanıcı adını kaydet"));
    await user.type(form.getByLabelText("Yeni kullanıcı adı"), "yenigun");
    await user.type(form.getByLabelText("Mevcut şifre"), "secret12345");
    await user.click(form.getByRole("button", { name: "Kullanıcı adını kaydet" }));

    await waitFor(() => {
      const call = calls.find((item) => item.path === "/api/v1/auth/change-username");
      expect(call?.method).toBe("PUT");
      expect(call?.body).toEqual({ new_username: "yenigun", current_password: "secret12345" });
    });
    expect(await screen.findByText("Kullanıcı adın güncellendi.")).toBeInTheDocument();
  });

  it("backend hata kodunu i18n mesajına çevirir", async () => {
    installFetch(() => mockResponse({ detail: "error_username_taken" }, 400));
    const user = userEvent.setup();
    renderTab();

    const form = within(formFor("Kullanıcı adını kaydet"));
    await user.type(form.getByLabelText("Yeni kullanıcı adı"), "efe");
    await user.type(form.getByLabelText("Mevcut şifre"), "secret12345");
    await user.click(form.getByRole("button", { name: "Kullanıcı adını kaydet" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Bu kullanıcı adı zaten alınmış.");
    expect(screen.queryByText("Kullanıcı adın güncellendi.")).not.toBeInTheDocument();
  });
});

describe("AccountTab — e-posta", () => {
  it("güncelleme gönderir ve email/autocomplete nitelikleri doğrudur", async () => {
    installFetch(() => mockResponse({ message: "ok", new_email: "yeni@example.com" }));
    const user = userEvent.setup();
    renderTab();

    const form = within(formFor("E-postayı kaydet"));
    const emailInput = form.getByLabelText("Yeni e-posta");
    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("autocomplete", "email");
    expect(emailInput).toHaveAttribute("inputmode", "email");

    await user.type(emailInput, "yeni@example.com");
    await user.type(form.getByLabelText("Mevcut şifre"), "secret12345");
    await user.click(form.getByRole("button", { name: "E-postayı kaydet" }));

    await waitFor(() => {
      const call = calls.find((item) => item.path === "/api/v1/auth/change-email");
      expect(call?.method).toBe("PUT");
      expect(call?.body).toEqual({ new_email: "yeni@example.com", current_password: "secret12345" });
    });
    expect(await screen.findByText("E-posta adresin güncellendi.")).toBeInTheDocument();
  });

  it("kullanımdaki e-posta hatasını i18n mesajına çevirir", async () => {
    installFetch(() => mockResponse({ detail: "Email already in use" }, 400));
    const user = userEvent.setup();
    renderTab();

    const form = within(formFor("E-postayı kaydet"));
    await user.type(form.getByLabelText("Yeni e-posta"), "baskasi@example.com");
    await user.type(form.getByLabelText("Mevcut şifre"), "secret12345");
    await user.click(form.getByRole("button", { name: "E-postayı kaydet" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Bu e-posta zaten kullanımda.");
  });
});

describe("AccountTab — avatar", () => {
  it("avatar seçip kaydeder ve radio erişilebilir adları vardır", async () => {
    installFetch(() => mockResponse({ message: "ok", avatar_id: "avatar-2" }));
    const user = userEvent.setup();
    renderTab();

    expect(screen.getByRole("radio", { name: "Avatar 1" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Avatar 2" }));
    await user.click(screen.getByRole("button", { name: "Avatarı kaydet" }));

    await waitFor(() => {
      const call = calls.find((item) => item.path === "/api/v1/profile/avatar");
      expect(call?.method).toBe("PUT");
      expect(call?.body).toEqual({ avatar_id: "avatar-2" });
    });
    expect(await screen.findByText("Avatar güncellendi.")).toBeInTheDocument();
  });
});

describe("AccountTab — kullanıcı adı alanı", () => {
  it("autocomplete=username taşır", () => {
    installFetch(() => mockResponse({}));
    renderTab();
    expect(screen.getByLabelText("Yeni kullanıcı adı")).toHaveAttribute(
      "autocomplete",
      "username",
    );
  });
});
