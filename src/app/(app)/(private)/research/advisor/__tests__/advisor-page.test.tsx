/**
 * `/research/advisor` sayfa testleri (Faz 5 / Birim 5A.2).
 *
 * Sayfa bir RSC kabuğudur; veri istemci adasında çekilir. Backend kapalıyken
 * bile sayfa render edilmeli ve çökmemelidir.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdvisorPage from "@/app/(app)/(private)/research/advisor/page";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderPage(page: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(<QueryClientProvider client={client}>{page}</QueryClientProvider>);
}

describe("/research/advisor", () => {
  it("iki modu ve profili render eder", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ disabled_features: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })),
    );

    renderPage(AdvisorPage());

    expect(screen.getByRole("heading", { level: 1, name: "Yatırım Danışmanı" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Hisse önerisi/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Portföy profili/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analiz et" })).toBeInTheDocument();
  });

  it("backend kapalıyken çökmez", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("backend unreachable");
      }),
    );

    renderPage(AdvisorPage());

    expect(screen.getByRole("heading", { level: 1, name: "Yatırım Danışmanı" })).toBeInTheDocument();
  });
});
