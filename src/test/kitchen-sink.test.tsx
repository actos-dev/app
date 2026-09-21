/**
 * `/kitchen-sink` vitrin testleri (Faz 1 / Birim 1.5).
 *
 * Sayfa sunucu bileşenidir; testte doğrudan çağrılır (`NODE_ENV=test` guard'ı
 * geçer). `next-intl/server` yalnız `generateMetadata`'da kullanıldığı için
 * mock'lanır; üretim guard'ı `next/navigation.notFound` gözlemlenerek
 * doğrulanır.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";

import KitchenSinkPage from "@/app/(app)/kitchen-sink/page";

const navigation = vi.hoisted(() => ({ notFound: vi.fn() }));

vi.mock("next/navigation", () => ({ notFound: navigation.notFound }));

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

const sectionTitles = [
  "Color roles",
  "Typography",
  "Buttons",
  "Form controls",
  "Navigation & layers",
  "Notifications",
  "States",
] as const;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  navigation.notFound.mockClear();
});

describe("/kitchen-sink", () => {
  it("yedi vitrin bölümünü başlıklarıyla render eder", () => {
    render(<KitchenSinkPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Kitchen sink" })).toBeInTheDocument();
    for (const title of sectionTitles) {
      expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
    }
  });

  it("üretim ortamında notFound() çağırır", () => {
    vi.stubEnv("NODE_ENV", "production");

    render(<KitchenSinkPage />);

    expect(navigation.notFound).toHaveBeenCalledOnce();
  });

  it("Dialog vitrin örneği açılır ve Escape ile kapanır", async () => {
    const user = userEvent.setup();
    render(<KitchenSinkPage />);

    await user.click(screen.getByRole("button", { name: "Open confirm dialog" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Confirm order");
    expect(
      within(dialog).getByText(
        "BUY 25 THYAO @ 312,75 · estimated cost 7.826,57 TRY including commission.",
      ),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("toast tetikleyicisi sonner çağrısını yapar", async () => {
    const successSpy = vi.spyOn(toast, "success");
    const user = userEvent.setup();
    render(<KitchenSinkPage />);

    await user.click(screen.getByRole("button", { name: "Success toast" }));

    expect(successSpy).toHaveBeenCalledOnce();
    expect(successSpy).toHaveBeenCalledWith("Saved", { description: "The change is live." });
  });

  it("FormField hata örneğinde role=alert gösterir", () => {
    render(<KitchenSinkPage />);

    const input = screen.getByLabelText("Quantity");
    const field = input.closest("div");
    expect(field).not.toBeNull();

    expect(within(field as HTMLElement).getByRole("alert")).toHaveTextContent(
      "Quantity must be a positive integer.",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});
