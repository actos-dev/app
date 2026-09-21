/**
 * AppShell ve navigasyon testleri (plan §4, A-02, A-04, D-09).
 *
 * `AppShell` sunucu bileşenidir; testte önce doğrudan çağrılıp çözülür, sonra
 * istemci ağacı gerçek `tr` kataloğuyla render edilir. `usePathname` mock'lanır
 * (aktiflik rota başına değiştirilir), `next/headers` çerezsiz kabul edilir.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/shared/AppShell";
import { renderWithIntl } from "@/test/test-utils";

const mocks = vi.hoisted(() => ({ pathname: "/markets" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined }),
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
  return renderWithIntl(ui);
}

describe("AppShell", () => {
  it("navigasyon gruplarını ve öğelerini render eder", async () => {
    await renderShell();

    for (const group of ["Piyasa", "Portföy", "Araştırma", "Hesap"]) {
      expect(screen.getByRole("heading", { name: group })).toBeInTheDocument();
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
      expect(screen.getByRole("link", { name: item })).toBeInTheDocument();
    }

    expect(screen.getByText("Sayfa içeriği")).toBeInTheDocument();
  });

  it("aktif rotayı aria-current=\"page\" ile işaretler", async () => {
    mocks.pathname = "/markets";
    await renderShell();

    expect(screen.getByRole("link", { name: "Piyasalar" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Portföyler" })).not.toHaveAttribute("aria-current");
  });

  it("alt rotada üst öğeyi aktif sayar", async () => {
    mocks.pathname = "/portfolio/42";
    await renderShell();

    expect(screen.getByRole("link", { name: "Portföyler" })).toHaveAttribute(
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
