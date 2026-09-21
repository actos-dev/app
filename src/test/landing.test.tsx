/**
 * Landing testleri (Faz 2 / Birim 2.3a).
 *
 * Sayfa sunucu bileşenidir; testte önce çözülür, sonra gerçek `tr` kataloğuyla
 * render edilir. `next-intl/server` katalogdan çözecek şekilde mock'lanır.
 */
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LandingPage from "@/app/(public)/page";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next-intl/server", async () => {
  const messages = (await import("../../messages/tr.json")).default as Record<string, unknown>;
  const resolve = (namespace: string | undefined, key: string): string => {
    const path = namespace ? `${namespace}.${key}` : key;
    let current: unknown = messages;
    for (const part of path.split(".")) {
      current =
        current !== null && typeof current === "object"
          ? (current as Record<string, unknown>)[part]
          : undefined;
    }
    return typeof current === "string" ? current : path;
  };
  return {
    getLocale: () => Promise.resolve("tr"),
    getTranslations: (namespace?: string) =>
      Promise.resolve((key: string) => resolve(namespace, key)),
  };
});

async function renderLanding() {
  const ui = await LandingPage();
  return renderWithIntl(ui);
}

describe("landing", () => {
  it("TR katalogla hero başlığını ve iki CTA'yı render eder", async () => {
    await renderLanding();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "BIST'i canlı izle, portföyünü risksiz kur.",
      }),
    ).toBeInTheDocument();

    const primary = screen.getByRole("link", { name: "Ücretsiz hesap oluştur" });
    expect(primary).toHaveAttribute("href", "/register");

    const secondary = screen.getByRole("link", { name: "Piyasaları gör" });
    expect(secondary).toHaveAttribute("href", "/markets");
  });

  it("dört özellik kartı render eder", async () => {
    await renderLanding();

    const grid = screen.getByTestId("landing-features");
    expect(within(grid).getAllByRole("listitem")).toHaveLength(4);
    expect(within(grid).getByText("Canlı piyasa verisi")).toBeInTheDocument();
    expect(within(grid).getByText("Monte-Carlo simülasyonu")).toBeInTheDocument();
  });

  it("WebSite + SearchAction JSON-LD yerleştirir (X-06)", async () => {
    const { container } = await renderLanding();

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();

    const data = JSON.parse(script?.textContent ?? "{}") as {
      "@graph": Array<Record<string, unknown>>;
    };
    const website = data["@graph"].find((node) => node["@type"] === "WebSite");
    expect(website).toBeDefined();
    expect(website?.potentialAction).toMatchObject({ "@type": "SearchAction" });
  });
});
