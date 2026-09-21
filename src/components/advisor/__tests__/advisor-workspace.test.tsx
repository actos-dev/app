/**
 * `AdvisorWorkspace` testleri (Faz 5 / Birim 5A.2).
 *
 * `GET /maintenance` `advisor` özelliğini bakımda dönerse üstte net uyarı
 * gösterilir ve gönderim kilitlenir; eski uygulamadaki sessiz başarısızlık
 * tekrarlanmaz.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdvisorWorkspace } from "@/components/advisor/AdvisorWorkspace";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function installFetch(disabledFeatures: string[] | "down") {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const raw =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(raw, "http://localhost").pathname;
      if (path === "/api/v1/maintenance") {
        if (disabledFeatures === "down") {
          throw new Error("backend unreachable");
        }
        return new Response(JSON.stringify({ disabled_features: disabledFeatures }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }),
  );
}

function renderWorkspace() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <AdvisorWorkspace />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AdvisorWorkspace — bakım durumu", () => {
  it("advisor bakımdayken uyarı gösterir ve formu kilitler", async () => {
    installFetch(["advisor"]);
    renderWorkspace();

    expect(await screen.findByText("Danışman bakımda")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analiz et" })).toBeDisabled();
  });

  it("bakım listesi boşken kilit uygulamaz", async () => {
    installFetch([]);
    renderWorkspace();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Analiz et" })).toBeEnabled();
    });
    expect(screen.queryByText("Danışman bakımda")).not.toBeInTheDocument();
  });

  it("maintenance ucu çökerse sayfa çökmez ve form açık kalır", async () => {
    installFetch("down");
    renderWorkspace();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Analiz et" })).toBeEnabled();
    });
  });
});
