import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../button";

describe("Button", () => {
  it("tıklamada onClick çağırır", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Kaydet</Button>);

    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled iken tıklamayı iletmez", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Kaydet
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("loading iken aria-busy yazar ve tıklamayı engeller", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Kaydet
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Kaydet" });

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("varyant sınıfları token utility'si kullanır", () => {
    render(<Button variant="secondary">Kaydet</Button>);

    expect(screen.getByRole("button", { name: "Kaydet" })).toHaveClass(
      "border-border",
      "bg-surface",
    );
  });
});
