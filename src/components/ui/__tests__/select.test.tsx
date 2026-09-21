import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Select } from "../select";

const options = [
  { value: "dark", label: "Koyu" },
  { value: "light", label: "Açık" },
  { value: "sepia", label: "Sepya" },
];

describe("Select", () => {
  it("açılır, seçenek seçilir ve değer tetikleyicide görünür", async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Tema" placeholder="Tema seç" />);
    const trigger = screen.getByRole("combobox", { name: "Tema" });

    expect(trigger).toHaveTextContent("Tema seç");

    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "Açık" }));

    await waitFor(() => {
      expect(trigger).toHaveTextContent("Açık");
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("klavye ile gezinti ve seçim yapılabilir", async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Tema" />);
    const trigger = screen.getByRole("combobox", { name: "Tema" });

    trigger.focus();
    await user.keyboard("{ArrowDown}");

    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(trigger).toHaveTextContent("Koyu");
    });
  });
});
