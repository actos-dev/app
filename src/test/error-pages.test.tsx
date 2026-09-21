/**
 * Hata sayfaları render testleri (K-06).
 *
 * `not-found.tsx` sunucu bileşenidir: `getTranslations` mock'lanır ve sayfa
 * doğrudan çözülür. `error.tsx` client bileşenidir: gerçek `tr` kataloğuyla
 * render edilir; `reset` çağrısı doğrulanır.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import RouteError from "@/app/error";
import NotFound from "@/app/not-found";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

describe("not-found.tsx", () => {
  it("404 başlığını, açıklamayı ve ana sayfa bağlantısını gösterir", async () => {
    render(await NotFound());

    expect(screen.getByRole("heading", { level: 1, name: "notFoundTitle" })).toBeInTheDocument();
    expect(screen.getByText("notFoundDescription")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "goHome" })).toHaveAttribute("href", "/");
  });
});

describe("error.tsx", () => {
  it("genel hata metnini ve digest'i gösterir", () => {
    renderWithIntl(
      <RouteError
        error={Object.assign(new Error("boom"), { digest: "digest-42" })}
        reset={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Bir şeyler ters gitti" })).toBeInTheDocument();
    expect(screen.getByText(/digest-42/)).toBeInTheDocument();
  });

  it("tekrar dene butonu reset'i çağırır", async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<RouteError error={new Error("boom")} reset={reset} />);

    await user.click(screen.getByRole("button", { name: "Tekrar dene" }));

    expect(reset).toHaveBeenCalledOnce();
  });
});
