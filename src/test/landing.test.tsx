/**
 * Landing testleri (Faz 2 / Birim 2.3a, D-12).
 *
 * Sayfa sunucu bileşenidir; testte önce çözülür, sonra gerçek `tr` kataloğuyla
 * render edilir. `next-intl/server` katalogdan çözecek şekilde mock'lanır;
 * popüler hisse isteği `fetch` taklidiyle yanıtlanır (test hermetiktir).
 */
import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LandingPage from "@/app/(public)/page";
import { mockResponse } from "@/test/http";
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

function summaryRow(ticker: string) {
  return {
    ticker,
    name: `${ticker} A.Ş.`,
    sector: null,
    last_price: 312.4,
    change_pct: 1.84,
    previous_close: 306.7,
    absolute_change: 5.7,
    change_window: "last_session_change",
    market_status: "open",
    is_stale: false,
    as_of: "2026-09-22T08:00:00Z",
    previous_close_as_of: null,
    day_high: null,
    day_low: null,
    volume: 1,
    market_cap: 1,
    currency: "TRY",
    price_updated_at: null,
  };
}

function installFetch(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const raw =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(raw, "http://localhost:7055");
      if (url.pathname === "/api/v1/companies/summary") {
        return mockResponse({ data: [summaryRow("THYAO"), summaryRow("ASELS")], total: 2 });
      }
      return mockResponse({ detail: "not found" }, 404);
    }),
  );
}

beforeEach(() => {
  installFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderLanding() {
  const ui = await LandingPage();
  return renderWithIntl(ui);
}

describe("landing", () => {
  it("TR katalogla hero başlığını ve iki CTA'yı render eder", async () => {
    await renderLanding();

    const hero = screen
      .getByRole("heading", {
        level: 1,
        name: "BIST'i canlı izle, veriyi analiz et, kararlarını sına.",
      })
      .closest("section");
    expect(hero).not.toBeNull();

    const primary = within(hero as HTMLElement).getByRole("link", {
      name: "Ücretsiz hesap oluştur",
    });
    expect(primary).toHaveAttribute("href", "/register");

    const secondary = within(hero as HTMLElement).getByRole("link", { name: "Piyasaları gör" });
    expect(secondary).toHaveAttribute("href", "/markets");
  });

  it("popüler hisseleri gerçek veriyle ve piyasa bağlantısıyla render eder", async () => {
    await renderLanding();

    expect(screen.getByText("Piyasada öne çıkanlar")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tüm piyasayı gör" })).toHaveAttribute(
      "href",
      "/markets",
    );
    const thyao = screen.getByRole("link", { name: /THYAO/ });
    expect(thyao).toHaveAttribute("href", "/symbol/THYAO");
    expect(within(thyao).getByText("312,40")).toBeInTheDocument();
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
