/**
 * AppShell ve navigasyon testleri (plan §4, A-02, A-04, D-09).
 *
 * `AppShell` sunucu bileşenidir; testte önce doğrudan çağrılıp çözülür, sonra
 * istemci ağacı gerçek `tr` kataloğuyla render edilir. `usePathname` mock'lanır
 * (aktiflik rota başına değiştirilir), `next/headers` çerezsiz kabul edilir.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/shared/AppShell";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

const mocks = vi.hoisted(() => ({
  pathname: "/markets",
  replace: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  // Faz 5C: AppShell oturumu `getSession()` ile çözer. Testler varsayılan
  // olarak oturumlu kullanıcıyı taklit eder; anonim senaryo `session.value =
  // null` ile kurulur.
  session: { value: { id: 1 } as unknown },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh, push: mocks.push }),
}));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined }),
  headers: () => Promise.resolve(new Headers()),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: () => Promise.resolve(mocks.session.value),
}));

// Komut paleti tema/dil server action'larını import eder; testte ağa çıkmasın.
vi.mock("@/i18n/actions", () => ({
  setTheme: vi.fn(),
  setLocale: vi.fn(),
}));

vi.mock("next-intl/server", async () => {
  const messages = (await import("../../../../messages/tr.json")).default as Record<string, unknown>;
  const resolve = (namespace: string | undefined, key: string): string => {
    const path = namespace ? `${namespace}.${key}` : key;
    let current: unknown = messages;
    for (const part of path.split(".")) {
      current =
        current !== null && typeof current === "object"
          ? (current as Record<string, unknown>)[part]
          : undefined;
    }
    return typeof current === "string" ? current : path;
  };
  return {
    getTranslations: (namespace?: string) =>
      Promise.resolve((key: string) => resolve(namespace, key)),
  };
});

async function renderShell() {
  const ui = await AppShell({ children: <p>Sayfa içeriği</p> });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

afterEach(() => {
  vi.unstubAllGlobals();
  mocks.replace.mockReset();
  mocks.refresh.mockReset();
  mocks.push.mockReset();
});

describe("AppShell", () => {
  beforeEach(() => {
    mocks.session.value = { id: 1 };
    // RSC kredi tohumu ve istemci tazelemesi ağa çıkmasın.
    vi.stubGlobal("fetch", vi.fn(async () => mockResponse({ credits: 10 })));
  });

  it("navigasyon gruplarını ve öğelerini render eder", async () => {
    const user = userEvent.setup();
    await renderShell();

    // Masaüstü üst barda yalnız tek öğeli grup ve birincil bağlantı düz linktir;
    // tam harita mobil çekmecede gruplanmış olarak durur.
    expect(screen.getByRole("link", { name: "Genel Bakış" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Portföy" })).toHaveAttribute("href", "/portfolio");

    await user.click(screen.getByRole("button", { name: "Menüyü aç" }));
    const dialog = await screen.findByRole("dialog");

    for (const group of ["Piyasa", "Portföy", "Araştırma", "Hesap"]) {
      expect(within(dialog).getByRole("heading", { name: group })).toBeInTheDocument();
    }
    for (const item of [
      "Genel Bakış",
      "Piyasalar",
      "Takip Listesi",
      "Portföyler",
      "Raporlar",
      "Simülasyon",
      "Yatırım Danışmanı",
      "Piyasa Bülteni",
      "Veri Merkezi",
      "Profil",
    ]) {
      expect(within(dialog).getByRole("link", { name: item })).toBeInTheDocument();
    }

    expect(screen.getByText("Sayfa içeriği")).toBeInTheDocument();
  });

  it("aktif rotayı aria-current=\"page\" ile işaretler", async () => {
    mocks.pathname = "/markets";
    const user = userEvent.setup();
    await renderShell();

    await user.click(screen.getByRole("button", { name: "Menüyü aç" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("link", { name: "Piyasalar" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(dialog).getByRole("link", { name: "Portföyler" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("alt rotada üst öğeyi aktif sayar", async () => {
    mocks.pathname = "/portfolio/42";
    const user = userEvent.setup();
    await renderShell();

    await user.click(screen.getByRole("button", { name: "Menüyü aç" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("link", { name: "Portföyler" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("skip link main hedefini işaret eder", async () => {
    await renderShell();

    const skipLink = screen.getByRole("link", { name: "İçeriğe geç" });
    expect(skipLink).toHaveAttribute("href", "#main-content");
    expect(document.getElementById("main-content")).toBeInTheDocument();
  });

  it("topbar'da kredi göstergesini ve hesap menüsünü render eder", async () => {
    await renderShell();

    expect(screen.getByRole("button", { name: "Hesap menüsü" })).toBeInTheDocument();
    expect(screen.getByText("Kredi")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("mobil menü panelini açar ve Escape ile kapatır", async () => {
    const user = userEvent.setup();
    await renderShell();

    await user.click(screen.getByRole("button", { name: "Menüyü aç" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Genel Bakış" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

describe("AppShell — anonim (5C / X-03)", () => {
  beforeEach(() => {
    mocks.session.value = null;
  });

  it("çerez yoksa kişisel uçlara AĞ ÇAĞRISI yapmaz", async () => {
    const fetchMock = vi.fn(async () => mockResponse({ credits: 10 }));
    vi.stubGlobal("fetch", fetchMock);

    await renderShell();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Giriş/Kayıt gösterir; kredi, hesap menüsü ve duyuru zili gizlenir", async () => {
    await renderShell();

    expect(screen.getByRole("link", { name: "Giriş" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Kayıt" })).toHaveAttribute("href", "/register");
    expect(screen.queryByRole("button", { name: "Hesap menüsü" })).not.toBeInTheDocument();
    expect(screen.queryByText("Kredi")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Duyurular" })).not.toBeInTheDocument();
  });

  it("kişisel nav kilitli ve /login?next= hedefine gider; piyasa açık kalır", async () => {
    const user = userEvent.setup();
    await renderShell();

    // Masaüstü üst bar: birincil bağlantı ve tek öğeli grup.
    expect(screen.getByRole("link", { name: "Genel Bakış" })).toHaveAttribute("href", "/dashboard");
    const portfolio = screen.getByRole("link", { name: "Portföy" });
    expect(portfolio).toHaveAttribute("href", "/login?next=%2Fportfolio");
    expect(portfolio).toHaveAttribute("aria-disabled", "true");

    await user.click(screen.getByRole("button", { name: "Menüyü aç" }));
    const dialog = await screen.findByRole("dialog");

    const watchlist = within(dialog).getByRole("link", { name: "Takip Listesi" });
    expect(watchlist).toHaveAttribute("href", "/login?next=%2Fwatchlist");
    expect(watchlist).toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).getByRole("link", { name: "Portföyler" })).toHaveAttribute(
      "href",
      "/login?next=%2Fportfolio",
    );
    expect(within(dialog).getByRole("link", { name: "Piyasalar" })).toHaveAttribute(
      "href",
      "/markets",
    );
    expect(within(dialog).getByRole("link", { name: "Piyasa Bülteni" })).toHaveAttribute(
      "href",
      "/digest",
    );
  });
});
