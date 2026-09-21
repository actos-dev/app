/**
 * `/research/reports/[id]` detay sayfası testleri (Faz 5 / Birim 5A.1, S-03, K-09).
 *
 * Doğrulananlar:
 *   - RSC verisiyle başlık, meta, sanitize edilmiş markdown ve kaynak listesi,
 *   - 404'te `notFound()`.
 */
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ReportDetailPage from "@/app/(app)/research/reports/[id]/page";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const reportPayload = {
  success: true,
  report_id: 42,
  about: "ASELS",
  type: "quick_report",
  title: "ASELS Analizi",
  token_usage: { prompt: 100, completion: 200, total: 300 },
  credits_spend: 20,
  purpose: "Temettü verimliliği nasıl?",
  report: "## Özet\n\nOlumlu bir görünüm var.\n\n<script>alert('xss')</script>",
  sentiments: [
    {
      sentiment: "positive",
      url: "https://example.com/haber",
      reasoning: "Güçlü bilanço.",
    },
  ],
  created_at: "2026-09-21T10:00:00Z",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function installFetch(handler: () => Response | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      const response = handler();
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

const pageProps = {
  params: Promise.resolve({ id: "42" }),
  searchParams: Promise.resolve({}),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/research/reports/[id]", () => {
  it("başlık, meta, markdown ve kaynakları çizer", async () => {
    installFetch(() => jsonResponse(reportPayload));

    renderWithIntl(await ReportDetailPage(pageProps));

    expect(screen.getByRole("heading", { level: 1, name: "ASELS Analizi" })).toBeInTheDocument();
    // Markdown SSR edilir.
    expect(screen.getByRole("heading", { level: 2, name: "Özet" })).toBeInTheDocument();
    expect(screen.getByText("Olumlu bir görünüm var.")).toBeInTheDocument();
    // Ham HTML markdown gövdesinde etkinleşmez.
    expect(document.querySelector("script")).toBeNull();

    // Duygu ve dış kaynak.
    expect(screen.getByText("Olumlu")).toBeInTheDocument();
    const source = screen.getByRole("link", { name: "Kaynağı aç" });
    expect(source).toHaveAttribute("href", "https://example.com/haber");

    // Amaç alanı.
    expect(screen.getByText("Temettü verimliliği nasıl?")).toBeInTheDocument();
  });

  it("404'te notFound() çağırır", async () => {
    installFetch(() => jsonResponse({ detail: "error_report_not_found" }, 404));

    await expect(ReportDetailPage(pageProps)).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
