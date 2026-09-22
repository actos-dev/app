/**
 * `/profile` sayfası testleri (Faz 5 / Birim 5B.2).
 *
 * Sayfa sunucu bileşenidir; `global.fetch`, `next/headers` ve `next-intl/server`
 * mock'lanır. Doğrulananlar: profil isteği, sekmelerin render'ı ve
 * `GET /profile` başarısızken çökmeden geri dönüş durumu gösterilmesi.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "@/app/(app)/(private)/profile/page";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "theme" ? { value: "dark" } : undefined),
  }),
  headers: async () => new Headers(),
}));

vi.mock("next-intl/server", async () => {
  const messages = (await import("../../../../../../messages/tr.json")).default as Record<
    string,
    unknown
  >;
  const resolve = (
    namespace: string | undefined,
    key: string,
    values?: Record<string, unknown>,
  ): string => {
    const path = namespace ? `${namespace}.${key}` : key;
    let current: unknown = messages;
    for (const part of path.split(".")) {
      current =
        current !== null && typeof current === "object"
          ? (current as Record<string, unknown>)[part]
          : undefined;
    }
    if (typeof current !== "string") {
      return path;
    }
    if (!values) {
      return current;
    }
    return current.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in values ? String(values[name]) : match,
    );
  };
  return {
    getTranslations:
      (namespace?: string) =>
      (key: string, values?: Record<string, unknown>) =>
        resolve(namespace, key, values),
  };
});

const profile = {
  username: "efe",
  email: "efe@example.com",
  user_type: "user",
  created_at: "2026-01-02T10:00:00Z",
  email_verified: true,
  avatar_id: "avatar-1",
  credits: 20,
};

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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderPage(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/profile", () => {
  it("profili çeker ve sekmeleri render eder", async () => {
    installFetch((path) => {
      if (path === "/api/v1/profile") return jsonResponse(profile);
      return null;
    });

    renderPage(await ProfilePage());

    expect(screen.getByRole("heading", { level: 1, name: "Profil" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Hesap" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Görünüm" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Güvenlik" })).toBeInTheDocument();
    // Hesap sekmesi varsayılan açık: kullanıcı adı görünür.
    expect(screen.getByText("efe")).toBeInTheDocument();

    expect(calls.map((call) => call.path).sort()).toEqual(["/api/v1/profile"]);
  });

  it("profil alınamazsa çökmeden geri dönüş durumu gösterir", async () => {
    installFetch((path) => {
      if (path === "/api/v1/profile") return jsonResponse({ detail: "Database error" }, 500);
      return null;
    });

    renderPage(await ProfilePage());

    expect(screen.getByRole("alert")).toHaveTextContent("Profil yüklenemedi");
    expect(screen.queryByRole("tab", { name: "Hesap" })).not.toBeInTheDocument();
  });
});
