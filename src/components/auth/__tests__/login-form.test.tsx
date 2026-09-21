/**
 * Giriş formu testleri (plan U-01, A-01).
 *
 * Sessiz geri yükleme, boş gönderim doğrulaması, backend hatası eşlemesi ve
 * başarılı girişte yönlendirme doğrulanır. `next/navigation` ve `fetch`
 * mock'lanır.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/LoginForm";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

const { replace, refresh, push } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("boş gönderimde doğrulama mesajı gösterir", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({ detail: "nope" }, 401)));
    const user = userEvent.setup();

    renderWithIntl(<LoginForm nextPath="/dashboard" />);

    await user.click(await screen.findByRole("button", { name: "Giriş yap" }));

    expect(await screen.findByText("Kullanıcı adı gerekli.")).toBeInTheDocument();
    expect(screen.getByText("Şifre gerekli.")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("geçersiz kimlikte backend hatasını gösterir", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({}, 401))
      .mockResolvedValueOnce(mockResponse({ detail: "error_login_failed" }, 400));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithIntl(<LoginForm nextPath="/dashboard" />);

    await screen.findByRole("button", { name: "Giriş yap" });
    await user.type(screen.getByLabelText("Kullanıcı adı"), "efe");
    await user.type(screen.getByLabelText("Şifre"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    expect(await screen.findByText("Kullanıcı adı veya şifre hatalı.")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("başarılı girişte next hedefine yönlendirir", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({}, 401))
      .mockResolvedValueOnce(mockResponse({ access_token: "a", token_type: "bearer" }, 200));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithIntl(<LoginForm nextPath="/dashboard" />);

    await screen.findByRole("button", { name: "Giriş yap" });
    await user.type(screen.getByLabelText("Kullanıcı adı"), "efe");
    await user.type(screen.getByLabelText("Şifre"), "correct-password");
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/dashboard");
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("mount'ta oturumu geri yükleyebilirse yönlendirir", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({}, 200));
    vi.stubGlobal("fetch", fetchMock);

    renderWithIntl(<LoginForm nextPath="/watchlist" />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/watchlist");
    });
    expect(screen.queryByRole("button", { name: "Giriş yap" })).not.toBeInTheDocument();
  });
});
