/**
 * `DigestArchiveNav` testleri (Faz 5 / Birim 5A.3, U-08).
 *
 * Tarih seçici, gün gezinmesi ve slot sekmeleri URL = state ilkesine göre
 * doğrulanır; gelecek tarih kapısı ve mevcut olmayan slotun devre dışı
 * görünmesi kontrol edilir.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DigestArchiveNav } from "@/components/digest/DigestArchiveNav";
import { renderWithIntl } from "@/test/test-utils";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

afterEach(() => {
  pushMock.mockReset();
});

describe("DigestArchiveNav", () => {
  it("tarih seçicisini ve yalnız mevcut slotları bağlantı olarak render eder", () => {
    renderWithIntl(
      <DigestArchiveNav
        date="2026-09-01"
        availableSlots={["morning", "evening"]}
        today="2026-09-03"
      />,
    );

    expect(screen.getByLabelText("Tarih")).toHaveValue("2026-09-01");
    expect(screen.getByLabelText("Tarih")).toHaveAttribute("max", "2026-09-03");

    expect(screen.getByRole("link", { name: "Sabah" })).toHaveAttribute(
      "href",
      "/digest?date=2026-09-01&slot=morning",
    );
    expect(screen.getByRole("link", { name: "Akşam" })).toBeInTheDocument();

    // Öğle slotu o gün yok: bağlantı değil, devre dışı metin.
    expect(screen.queryByRole("link", { name: "Öğle" })).not.toBeInTheDocument();
    expect(screen.getByText("Öğle")).toHaveAttribute("aria-disabled", "true");
  });

  it("önceki gün düğmesi geri tarihe götürür", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <DigestArchiveNav
        date="2026-09-01"
        availableSlots={["morning"]}
        today="2026-09-03"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Önceki gün" }));

    expect(pushMock).toHaveBeenCalledWith("/digest?date=2026-08-31");
  });

  it("bugündeyken sonraki gün devre dışıdır", () => {
    renderWithIntl(
      <DigestArchiveNav
        date="2026-09-03"
        availableSlots={["morning"]}
        today="2026-09-03"
      />,
    );

    expect(screen.getByRole("button", { name: "Sonraki gün" })).toBeDisabled();
  });

  it("seçili slotu aria-current ile işaretler ve gün görünümüne dönüş sunar", () => {
    renderWithIntl(
      <DigestArchiveNav
        date="2026-09-01"
        slot="morning"
        availableSlots={["morning", "noon"]}
        today="2026-09-03"
      />,
    );

    expect(screen.getByRole("link", { name: "Sabah" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Günün tüm slotları" })).toHaveAttribute(
      "href",
      "/digest?date=2026-09-01",
    );
  });
});
