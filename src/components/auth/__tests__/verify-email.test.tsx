/**
 * E-posta doğrulama ekranı testleri (plan U-01).
 *
 * Token ile başarı/hata ve token yokken yeniden gönderme akışı doğrulanır.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VerifyEmail } from "@/components/auth/VerifyEmail";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

describe("VerifyEmail", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("token ile doğrulama başarısını gösterir", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse({ message: "Email verified", email_verified: true })),
    );

    renderWithIntl(<VerifyEmail token="valid-token" email={null} />);

    expect(
      await screen.findByRole("heading", { name: "E-posta doğrulandı" }),
    ).toBeInTheDocument();
  });

  it("geçersiz token hatasını eşler", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          mockResponse({ detail: "Invalid or expired verification token" }, 400),
        ),
    );

    renderWithIntl(<VerifyEmail token="expired-token" email={null} />);

    expect(
      await screen.findByRole("heading", { name: "Doğrulama başarısız" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Doğrulama bağlantısı geçersiz veya süresi dolmuş."),
    ).toBeInTheDocument();
  });

  it("token yokken bilgi ve e-posta dolu yeniden gönderme formu gösterir", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ verification_sent: true }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithIntl(<VerifyEmail token={null} email="efe@example.com" />);

    expect(screen.getByRole("heading", { name: "E-postanı doğrula" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-posta")).toHaveValue("efe@example.com");

    await user.click(
      screen.getByRole("button", { name: "Doğrulama e-postasını tekrar gönder" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(
      await screen.findByText("Doğrulama e-postası gönderildi. Gelen kutunu kontrol et."),
    ).toBeInTheDocument();
  });
});
