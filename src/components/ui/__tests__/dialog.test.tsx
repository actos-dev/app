import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Button } from "../button";
import { Dialog } from "../dialog";

function Demo() {
  return (
    <Dialog
      trigger={<Button>Profili aç</Button>}
      title="Profil"
      description="Hesap ayarlarını düzenle"
    >
      <p>Form içeriği</p>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("tetikleyici ile açılır, başlık ve açıklamayı gösterir", async () => {
    const user = userEvent.setup();
    render(<Demo />);

    await user.click(screen.getByRole("button", { name: "Profili aç" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Profil");
    expect(screen.getByText("Hesap ayarlarını düzenle")).toBeInTheDocument();
    expect(screen.getByText("Form içeriği")).toBeInTheDocument();
  });

  it("Escape ile kapanır ve odak tetikleyiciye döner", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    const trigger = screen.getByRole("button", { name: "Profili aç" });

    await user.click(trigger);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it("kapat butonu erişilebilir ada sahiptir", async () => {
    const user = userEvent.setup();
    render(<Demo />);

    await user.click(screen.getByRole("button", { name: "Profili aç" }));
    await screen.findByRole("dialog");

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
