import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Switch } from "../switch";

describe("Switch", () => {
  it("etiketle kullanılabilir ve tıklama değeri değiştirir", async () => {
    const user = userEvent.setup();
    render(
      <label>
        <Switch />
        Fiyat uyarıları
      </label>,
    );
    const control = screen.getByRole("switch", { name: "Fiyat uyarıları" });

    expect(control).not.toBeChecked();

    await user.click(control);

    expect(control).toBeChecked();
  });
});
