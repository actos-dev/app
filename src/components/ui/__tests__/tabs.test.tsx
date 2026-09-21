import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Tabs, type TabItem } from "../tabs";

const items: readonly TabItem[] = [
  { value: "positions", label: "Pozisyonlar", content: <p>Pozisyon içeriği</p> },
  { value: "trades", label: "İşlemler", content: <p>İşlem içeriği</p> },
  { value: "analysis", label: "Analiz", content: <p>Analiz içeriği</p> },
];

describe("Tabs", () => {
  it("ok tuşuyla sekmeyi değiştirir", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} defaultValue="positions" />);

    await user.click(screen.getByRole("tab", { name: "Pozisyonlar" }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "İşlemler" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("İşlem içeriği")).toBeInTheDocument();
  });

  it("tıklama ile panel değişir", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} defaultValue="positions" />);

    await user.click(screen.getByRole("tab", { name: "Analiz" }));

    expect(screen.getByText("Analiz içeriği")).toBeInTheDocument();
    expect(screen.queryByText("Pozisyon içeriği")).not.toBeInTheDocument();
  });

  it("keepMounted pasif paneli DOM'da tutar", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} defaultValue="positions" keepMounted />);

    expect(screen.getByText("Pozisyon içeriği")).toBeVisible();
    expect(screen.getByText("İşlem içeriği")).toBeInTheDocument();
    expect(screen.getByText("İşlem içeriği")).not.toBeVisible();

    await user.click(screen.getByRole("tab", { name: "İşlemler" }));

    expect(screen.getByText("İşlem içeriği")).toBeVisible();
    expect(screen.getByText("Pozisyon içeriği")).not.toBeVisible();
  });
});
