/**
 * Duyuru zili testleri (Faz 5 / Birim 5B.3, A-03).
 *
 * Doğrulananlar: okunmamış sayısının badge + `aria-label` + `role="status"`
 * olarak yansıması, popover'da liste, `POST /announcements/read` çağrısı ve
 * okundu sonrası sayacın sıfırlanması.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AnnouncementBell } from "@/components/shared/AnnouncementBell";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

type FetchCall = { path: string; method: string };

let calls: FetchCall[] = [];

function installFetch(handler: (path: string, method: string) => Response | null) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input), "http://localhost").pathname;
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ path, method });
      const response = handler(path, method);
      if (response === null) {
        throw new Error("backend unreachable");
      }
      return response;
    }),
  );
}

const announcements = [
  {
    id: 1,
    title: "Planlı bakım",
    content: "Cumartesi gecesi kısa bir bakım olacak.",
    sent_by: 1,
    created_at: "2026-02-01T10:00:00Z",
    updated_at: "2026-02-01T10:00:00Z",
    is_unread: true,
  },
  {
    id: 2,
    title: "Yeni özellik",
    content: "Veri merkezi yayında.",
    sent_by: 1,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    is_unread: false,
  },
];

function renderBell() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <AnnouncementBell initialAnnouncements={{ announcements }} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AnnouncementBell", () => {
  it("okunmamış sayısını gösterir ve okundu POST'u gönderir", async () => {
    installFetch((path) =>
      path === "/api/v1/announcements/read" ? mockResponse({ message: "ok" }) : null,
    );
    const user = userEvent.setup();
    renderBell();

    const trigger = screen.getByRole("button", { name: "Duyurular, 1 okunmamış" });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 yeni duyuru");

    await user.click(trigger);

    expect(await screen.findByText("Planlı bakım")).toBeInTheDocument();
    expect(screen.getByText("Cumartesi gecesi kısa bir bakım olacak.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Okundu olarak işaretle" }));

    await waitFor(() => {
      expect(
        calls.some((call) => call.path === "/api/v1/announcements/read" && call.method === "POST"),
      ).toBe(true);
    });
    // İyimser güncelleme: sayaç sıfırlanır ve buton kaybolur.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Duyurular" })).toBeInTheDocument();
    });
  });
});
