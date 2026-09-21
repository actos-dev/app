import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Checkbox } from "../checkbox";

describe("Checkbox", () => {
  it("etiket metnine tıklama değeri değiştirir", async () => {
    const user = userEvent.setup();
    render(
      <label>
        <Checkbox />
        Bildirimleri aç
      </label>,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Bildirimleri aç" });

    expect(checkbox).not.toBeChecked();

    await user.click(screen.getByText("Bildirimleri aç"));

    expect(checkbox).toBeChecked();
  });

  it("kontrole tıklama da değeri değiştirir", async () => {
    const user = userEvent.setup();
    render(
      <label>
        <Checkbox defaultChecked />
        Bildirimleri aç
      </label>,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Bildirimleri aç" });

    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
  });
});
