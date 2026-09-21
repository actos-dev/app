/**
 * Yeni şifre belirleme formu testleri (plan Faz 2 / Birim 2.2b).
 *
 * Token yokluğu, şifre uyuşmazlığı, başarıda `/login`e yönlendirme ve
 * geçersiz/süresi dolmuş token durumu doğrulanır.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("token yoksa geçersiz bağlantı durumu gösterir ve istek atmaz", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderWithIntl(<ResetPasswordForm token={null} />);

    expect(screen.getByRole("heading", { name: "Bağlantı geçersiz" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Bu sıfırlama bağlantısı geçersiz");
    expect(screen.getByRole("link", { name: "Yeni bağlantı iste" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("şifre uyuşmazlığında doğrulama hatası gösterir ve istek atmaz", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithIntl(<ResetPasswordForm token="abc" />);

    await user.type(screen.getByLabelText("Şifre"), "0123456789");
    await user.type(screen.getByLabelText("Şifre (tekrar)"), "9876543210");
    await user.click(screen.getByRole("button", { name: "Şifreyi güncelle" }));

    expect(await screen.findByText("Şifreler eşleşmiyor.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("başarıda login sayfasına yönlendirir ve başarı mesajını duyurur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse({ message: "password reset successful" })),
    );
    const user = userEvent.setup();

    renderWithIntl(<ResetPasswordForm token="abc" />);

    await user.type(screen.getByLabelText("Şifre"), "0123456789");
    await user.type(screen.getByLabelText("Şifre (tekrar)"), "0123456789");
    await user.click(screen.getByRole("button", { name: "Şifreyi güncelle" }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login?reset=success");
    });
    expect(await screen.findByRole("heading", { name: "Şifre güncellendi" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Yeni şifrenle giriş yapabilirsin");
  });

  it("geçersiz token yanıtında geçersiz bağlantı durumuna geçer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse({ detail: "error_invalid_or_expired_token" }, 400)),
    );
    const user = userEvent.setup();

    renderWithIntl(<ResetPasswordForm token="expired" />);

    await user.type(screen.getByLabelText("Şifre"), "0123456789");
    await user.type(screen.getByLabelText("Şifre (tekrar)"), "0123456789");
    await user.click(screen.getByRole("button", { name: "Şifreyi güncelle" }));

    expect(await screen.findByRole("heading", { name: "Bağlantı geçersiz" })).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
