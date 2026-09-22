/**
 * Üst navigasyon testleri (plan §4, D6).
 *
 * `TopNav` istemci bileşenidir; `usePathname` mock'lanır. Çok öğeli gruplar
 * Base UI Menu ile açılır ve öğeler `menuitem` rolündedir; tek öğeli grup ise
 * grup etiketiyle düz bağlantı olur.
 */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TopNav } from "@/components/shared/TopNav";
import { renderWithIntl } from "@/test/test-utils";

const mocks = vi.hoisted(() => ({ pathname: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

beforeEach(() => {
  mocks.pathname = "/dashboard";
});

describe("TopNav", () => {
  it("birincil ve tek öğeli grubu düz bağlantı olarak render eder", () => {
    renderWithIntl(<TopNav />);

    expect(screen.getByRole("link", { name: "Genel Bakış" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Portföy" })).toHaveAttribute("href", "/portfolio");
    expect(screen.queryByRole("link", { name: "Portföyler" })).not.toBeInTheDocument();

    for (const group of ["Piyasa", "Araştırma", "Hesap"]) {
      expect(screen.getByRole("button", { name: group })).toBeInTheDocument();
    }
  });

  it("çok öğeli grubu menüyle açar ve öğeleri listeler", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TopNav />);

    await user.click(screen.getByRole("button", { name: "Piyasa" }));
    const menu = await screen.findByRole("menu");

    expect(within(menu).getByRole("menuitem", { name: "Piyasalar" })).toHaveAttribute(
      "href",
      "/markets",
    );
    expect(within(menu).getByRole("menuitem", { name: "Takip Listesi" })).toHaveAttribute(
      "href",
      "/watchlist",
    );
  });

  it("aktif rotayı bağlantıda ve menü tetikleyicisinde işaretler", async () => {
    mocks.pathname = "/markets";
    const user = userEvent.setup();
    renderWithIntl(<TopNav />);

    expect(screen.getByRole("link", { name: "Genel Bakış" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "Piyasa" })).toHaveClass("bg-surface-hover");

    await user.click(screen.getByRole("button", { name: "Piyasa" }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Piyasalar" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("alt rotada tek öğeli grup bağlantısını aktif sayar", () => {
    mocks.pathname = "/portfolio/42";
    renderWithIntl(<TopNav />);

    expect(screen.getByRole("link", { name: "Portföy" })).toHaveAttribute("aria-current", "page");
  });

  it("anonimde kişisel öğeleri kilitler ve girişe yönlendirir", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TopNav authenticated={false} />);

    const portfolio = screen.getByRole("link", { name: "Portföy" });
    expect(portfolio).toHaveAttribute("href", "/login?next=%2Fportfolio");
    expect(portfolio).toHaveAttribute("aria-disabled", "true");
    expect(portfolio).toHaveAttribute("title", "Bu bölüm için giriş yapmalısın");
    expect(screen.getByRole("link", { name: "Genel Bakış" })).toHaveAttribute("href", "/dashboard");

    await user.click(screen.getByRole("button", { name: "Piyasa" }));
    const menu = await screen.findByRole("menu");

    const markets = within(menu).getByRole("menuitem", { name: "Piyasalar" });
    expect(markets).toHaveAttribute("href", "/markets");
    expect(markets).not.toHaveAttribute("aria-disabled");

    const watchlist = within(menu).getByRole("menuitem", { name: "Takip Listesi" });
    expect(watchlist).toHaveAttribute("href", "/login?next=%2Fwatchlist");
    expect(watchlist).toHaveAttribute("aria-disabled", "true");
    expect(watchlist).toHaveAttribute("title", "Bu bölüm için giriş yapmalısın");
  });
});
