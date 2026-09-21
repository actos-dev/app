import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../button";
import { Menu } from "../menu";

describe("Menu", () => {
  it("açılır, ok tuşuyla gezinir ve öğe seçilir", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Menu
        trigger={<Button aria-label="Hesap menüsü">Hesap</Button>}
        items={[
          { label: "Profil", onSelect },
          { label: "Ayarlar" },
          { label: "Çıkış", destructive: true, separatorBefore: true },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Hesap menüsü" }));
    expect(await screen.findByRole("menu")).toBeInTheDocument();

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("Escape ile kapanır", async () => {
    const user = userEvent.setup();
    render(
      <Menu
        trigger={<Button aria-label="Hesap menüsü">Hesap</Button>}
        items={[{ label: "Profil" }, { label: "Ayarlar" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Hesap menüsü" }));
    await screen.findByRole("menu");

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });
});
