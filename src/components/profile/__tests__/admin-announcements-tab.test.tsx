/**
 * Yönetici duyuru sekmesi + erişim kapısı testleri (Faz 5 / Birim 5B.3).
 *
 * Doğrulananlar: admin CRUD (mock) çağrıları; `ProfileWorkspace`'te
 * "Duyurular" sekmesinin YALNIZ `user_type === 'admin'` iken görünmesi ve
 * admin olmayanda hiç render edilmemesi (istemci kapısı = UX).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminAnnouncementsTab } from "@/components/profile/AdminAnnouncementsTab";
import { ProfileWorkspace } from "@/components/profile/ProfileWorkspace";
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
];

function renderAdmin() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <AdminAnnouncementsTab />
    </QueryClientProvider>,
  );
}

function renderWorkspace(userType: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <ProfileWorkspace
        profile={{
          username: "efe",
          email: "efe@example.com",
          user_type: userType,
          created_at: "2026-01-02T10:00:00Z",
          email_verified: true,
          avatar_id: null,
          credits: 20,
        }}
        theme="dark"
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AdminAnnouncementsTab — CRUD", () => {
  it("duyuru oluşturur", async () => {
    installFetch((path, method) => {
      if (path === "/api/v1/announcements" && method === "GET") {
        return mockResponse({ announcements });
      }
      if (path === "/api/v1/announcements" && method === "POST") {
        return mockResponse({ ...announcements[0], id: 2, title: "Yeni" });
      }
      return null;
    });
    const user = userEvent.setup();
    renderAdmin();

    await screen.findByText("Planlı bakım");
    await user.click(screen.getByRole("button", { name: "Yeni duyuru" }));

    await user.type(screen.getByLabelText("Başlık"), "Yeni duyuru başlığı");
    await user.type(screen.getByLabelText("İçerik"), "İçerik metni");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      const call = calls.find((item) => item.method === "POST");
      expect(call?.path).toBe("/api/v1/announcements");
      expect(call?.body).toEqual({ title: "Yeni duyuru başlığı", content: "İçerik metni" });
    });
  });

  it("duyuruyu düzenler", async () => {
    installFetch((path, method) => {
      if (path === "/api/v1/announcements" && method === "GET") {
        return mockResponse({ announcements });
      }
      if (path === "/api/v1/announcements/1" && method === "PUT") {
        return mockResponse({ message: "ok" });
      }
      return null;
    });
    const user = userEvent.setup();
    renderAdmin();

    await screen.findByText("Planlı bakım");
    await user.click(screen.getByRole("button", { name: "Düzenle" }));

    const titleInput = screen.getByLabelText("Başlık");
    expect(titleInput).toHaveValue("Planlı bakım");
    await user.clear(titleInput);
    await user.type(titleInput, "Güncellenmiş başlık");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      const call = calls.find((item) => item.path === "/api/v1/announcements/1");
      expect(call?.method).toBe("PUT");
      expect(call?.body).toEqual({
        title: "Güncellenmiş başlık",
        content: "Cumartesi gecesi kısa bir bakım olacak.",
      });
    });
  });

  it("duyuruyu onayla siler", async () => {
    installFetch((path, method) => {
      if (path === "/api/v1/announcements" && method === "GET") {
        return mockResponse({ announcements });
      }
      if (path === "/api/v1/announcements/1" && method === "DELETE") {
        return mockResponse({ message: "ok" });
      }
      return null;
    });
    const user = userEvent.setup();
    renderAdmin();

    await screen.findByText("Planlı bakım");
    await user.click(screen.getByRole("button", { name: "Sil" }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Duyuruyu sil" }));

    await waitFor(() => {
      expect(
        calls.some((call) => call.path === "/api/v1/announcements/1" && call.method === "DELETE"),
      ).toBe(true);
    });
  });
});

describe("ProfileWorkspace — duyuru sekmesi kapısı", () => {
  it("admin olmayanda Duyurular sekmesini göstermez", () => {
    renderWorkspace("user");

    expect(screen.getByRole("tab", { name: "Botlar" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Duyurular" })).not.toBeInTheDocument();
  });

  it("admin iken Duyurular sekmesini gösterir", () => {
    renderWorkspace("admin");

    expect(screen.getByRole("tab", { name: "Duyurular" })).toBeInTheDocument();
  });
});
