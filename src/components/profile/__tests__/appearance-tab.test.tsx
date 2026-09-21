/**
 * Görünüm sekmesi testleri (Faz 5 / Birim 5B.2, U-11, B-15).
 *
 * Tema/dil değişimi çerez server action'ını çağırır ve tercihi best-effort
 * `PUT /user/preferences` ile hesaba yazar. PUT başarısız olsa da akış
 * kesilmez ve kullanıcıya hata gösterilmez.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppearanceTab } from "@/components/profile/AppearanceTab";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

const mocks = vi.hoisted(() => ({
  setTheme: vi.fn(),
  setLocale: vi.fn(),
}));

vi.mock("@/i18n/actions", () => ({
  setTheme: mocks.setTheme,
  setLocale: mocks.setLocale,
}));

type FetchCall = { path: string; method: string; body: unknown };

let calls: FetchCall[] = [];

function installFetch(handler: (path: string, method: string) => Response) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input), "http://localhost").pathname;
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ path, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return handler(path, method);
    }),
  );
}

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return renderWithIntl(
    <QueryClientProvider client={client}>
      <AppearanceTab theme="dark" />
    </QueryClientProvider>,
  );
}

function preferenceCall() {
  return calls.find((call) => call.path === "/api/v1/user/preferences");
}

beforeEach(() => {
  calls = [];
  mocks.setTheme.mockReset();
  mocks.setLocale.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AppearanceTab", () => {
  it("tema seçimi çerez action'ını ve tercih kaydını tetikler", async () => {
    installFetch(() => mockResponse({ theme: "light" }));
    const user = userEvent.setup();
    renderTab();

    await user.selectOptions(screen.getByLabelText("Tema"), "light");

    expect(mocks.setTheme).toHaveBeenCalledWith("light");
    await waitFor(() => {
      const call = preferenceCall();
      expect(call?.method).toBe("PUT");
      expect(call?.body).toEqual({ prefs: { theme: "light" } });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Tercihler hesabına kaydedildi.");
  });

  it("dil seçimi çerez action'ını ve tercih kaydını tetikler", async () => {
    installFetch(() => mockResponse({ locale: "en" }));
    const user = userEvent.setup();
    renderTab();

    await user.selectOptions(screen.getByLabelText("Dil"), "en");

    expect(mocks.setLocale).toHaveBeenCalledWith("en");
    await waitFor(() => {
      expect(preferenceCall()?.body).toEqual({ prefs: { locale: "en" } });
    });
  });

  it("tercih yazılamazsa sessizce devam eder (best-effort)", async () => {
    installFetch(() => mockResponse({ detail: "error_unknown" }, 500));
    const user = userEvent.setup();
    renderTab();

    await user.selectOptions(screen.getByLabelText("Tema"), "sepia");

    expect(mocks.setTheme).toHaveBeenCalledWith("sepia");
    await waitFor(() => expect(preferenceCall()).toBeDefined());
    // Akış sürer: hata gösterilmez, başarı notu da yayınlanmaz.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
