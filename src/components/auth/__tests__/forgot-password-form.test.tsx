/**
 * Şifre sıfırlama isteği formu testleri (plan Faz 2 / Birim 2.2b).
 *
 * Geçersiz e-posta doğrulaması, başarıda "gönderildi" durumu ve backend
 * hatasının `role="alert"` ile duyurulması doğrulanır.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

describe("ForgotPasswordForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("geçersiz e-postada doğrulama hatası gösterir ve istek atmaz", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ message: "ok" }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithIntl(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-posta"), "gecersiz");
    await user.click(screen.getByRole("button", { name: "Sıfırlama bağlantısı gönder" }));

    expect(await screen.findByText("Geçerli bir e-posta gir.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("başarıda gönderildi durumunu ve e-posta düzenleme yolunu gösterir", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        mockResponse({ message: "if the account exists, a password reset link was sent" }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithIntl(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-posta"), "efe@example.com");
    await user.click(screen.getByRole("button", { name: "Sıfırlama bağlantısı gönder" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Eğer bu e-posta ile bir hesap varsa",
    );

    await user.click(screen.getByRole("button", { name: "Farklı bir e-posta dene" }));

    expect(await screen.findByLabelText("E-posta")).toHaveValue("efe@example.com");
  });

  it("backend hatasında role=alert ile duyurur", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(mockResponse({ detail: "Too many requests. Please slow down." }, 429)),
    );
    const user = userEvent.setup();

    renderWithIntl(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-posta"), "efe@example.com");
    await user.click(screen.getByRole("button", { name: "Sıfırlama bağlantısı gönder" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Çok fazla deneme yaptın. Lütfen biraz bekle.",
    );
  });
});
