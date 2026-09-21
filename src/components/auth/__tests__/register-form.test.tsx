/**
 * Kayıt formu testleri (plan U-01).
 *
 * Başarıda `/verify-email?email=...` ekranına yönlendirme ve şifre
 * uyuşmazlığı doğrulaması test edilir.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

const { push, replace } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("şifre uyuşmazlığında doğrulama hatası gösterir ve istek atmaz", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({}, 200));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithIntl(<RegisterForm />);

    await user.type(screen.getByLabelText("Kullanıcı adı"), "efe");
    await user.type(screen.getByLabelText("E-posta"), "efe@example.com");
    await user.type(screen.getByLabelText("Şifre"), "0123456789");
    await user.type(screen.getByLabelText("Şifre (tekrar)"), "9876543210");
    await user.click(screen.getByRole("button", { name: "Kayıt ol" }));

    expect(await screen.findByText("Şifreler eşleşmiyor.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("başarıda verify-email ekranına yönlendirir", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ message: "Register successful", user_id: 1 }, 200));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithIntl(<RegisterForm />);

    await user.type(screen.getByLabelText("Kullanıcı adı"), "efe");
    await user.type(screen.getByLabelText("E-posta"), "efe@example.com");
    await user.type(screen.getByLabelText("Şifre"), "0123456789");
    await user.type(screen.getByLabelText("Şifre (tekrar)"), "0123456789");
    await user.click(screen.getByRole("button", { name: "Kayıt ol" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/verify-email?email=efe%40example.com");
    });
  });

  it("alınmış kullanıcı adında backend hatasını eşler", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ detail: "error_username_taken" }, 400));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithIntl(<RegisterForm />);

    await user.type(screen.getByLabelText("Kullanıcı adı"), "efe");
    await user.type(screen.getByLabelText("E-posta"), "efe@example.com");
    await user.type(screen.getByLabelText("Şifre"), "0123456789");
    await user.type(screen.getByLabelText("Şifre (tekrar)"), "0123456789");
    await user.click(screen.getByRole("button", { name: "Kayıt ol" }));

    expect(await screen.findByText("Bu kullanıcı adı zaten alınmış.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
