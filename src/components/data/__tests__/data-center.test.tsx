/**
 * Veri merkezi testleri (Faz 5 / Birim 5B.3).
 *
 * Doğrulananlar: talep oluşturma (POST gövdesi) → tek kayıt durumu → hazır
 * olunca indirme bağlantısı; boş durum; hata durumu; poll aralığının yalnız
 * aktif durumda döndüğü.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DataCenterWorkspace } from "@/components/data/DataCenterWorkspace";
import { exportRefetchInterval, EXPORT_POLL_INTERVAL_MS } from "@/hooks/useExports";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

type FetchCall = { path: string; method: string; body: unknown };

let calls: FetchCall[] = [];

function installFetch(handler: (path: string, method: string) => Response | null) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input), "http://localhost").pathname;
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({
        path,
        method,
        body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
      });
      const response = handler(path, method);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

const currentYear = new Date().getFullYear();

const readyJob = {
  id: 1,
  year: currentYear - 1,
  format: "csv",
  status: "ready",
  created_at: "2026-02-01T10:00:00Z",
  updated_at: "2026-02-01T10:05:00Z",
  row_count: 120,
  size_bytes: 1_048_576,
  downloaded_count: 0,
  expires_at: "2099-01-01T00:00:00Z",
  error: null,
  downloadable: true,
  download_url: "/api/v1/data/export/download/tok",
};

function renderWorkspace(initialExports: unknown[] | undefined) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <DataCenterWorkspace initialExports={initialExports as never} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DataCenterWorkspace — talep akışı", () => {
  it("talep oluşturur, durumu izler ve hazır olunca indirir", async () => {
    installFetch((path, method) => {
      if (path === "/api/v1/data/export" && method === "GET") return mockResponse([]);
      if (path === "/api/v1/data/export" && method === "POST") {
        return mockResponse({ export_id: 1, status: "queued" }, 202);
      }
      if (path === "/api/v1/data/export/1") return mockResponse(readyJob);
      if (path === "/api/v1/data/export/download/tok") {
        return new Response(new Blob([new Uint8Array([1, 2, 3])]), {
          status: 200,
          headers: { "content-disposition": 'attachment; filename="florence-daily-2025.csv.gz"' },
        });
      }
      return null;
    });

    // jsdom indirme API'lerini sağlamaz; indirme yolunu izlemek için taklit edilir.
    const urlMock = URL as unknown as {
      createObjectURL: (value: Blob) => string;
      revokeObjectURL: (value: string) => void;
    };
    urlMock.createObjectURL = vi.fn(() => "blob:mock");
    urlMock.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const user = userEvent.setup();
    renderWorkspace([]);

    await user.click(screen.getByRole("button", { name: "Talep oluştur" }));

    await waitFor(() => {
      const call = calls.find((item) => item.path === "/api/v1/data/export" && item.method === "POST");
      expect(call?.body).toEqual({ year: currentYear - 1, format: "csv" });
    });

    // Tek kayıt poll edilir ve hazır olunca indirme butonu belirir.
    expect(await screen.findByRole("button", { name: "İndir" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "İndir" }));
    await waitFor(() => {
      expect(
        calls.some((call) => call.path === "/api/v1/data/export/download/tok"),
      ).toBe(true);
    });
  });

  it("talep yokken boş durum gösterir", async () => {
    installFetch((path) => (path === "/api/v1/data/export" ? mockResponse([]) : null));

    renderWorkspace([]);

    expect(await screen.findByText("Henüz talebin yok")).toBeInTheDocument();
  });

  it("liste alınamazsa hata durumu gösterir", async () => {
    installFetch((path) =>
      path === "/api/v1/data/export" ? mockResponse({ detail: "Database error" }, 500) : null,
    );

    renderWorkspace(undefined);

    expect(await screen.findByText("Talepler yüklenemedi")).toBeInTheDocument();
  });
});

describe("exportRefetchInterval", () => {
  it("yalnız aktif durumlarda poll eder", () => {
    expect(exportRefetchInterval("queued")).toBe(EXPORT_POLL_INTERVAL_MS);
    expect(exportRefetchInterval("processing")).toBe(EXPORT_POLL_INTERVAL_MS);
    expect(exportRefetchInterval("ready")).toBe(false);
    expect(exportRefetchInterval("sent")).toBe(false);
    expect(exportRefetchInterval("failed")).toBe(false);
    expect(exportRefetchInterval(undefined)).toBe(false);
  });
});
