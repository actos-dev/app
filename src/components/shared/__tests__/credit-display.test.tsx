/**
 * `CreditDisplay` testleri (Faz 5 / Birim 5A.3, U-03).
 *
 * SSR tohumunun ağa çıkmadan gösterilmesi, tazelemenin bakiyeyi güncellemesi
 * ve düşük bakiyenin görsel olarak ayırt edilmesi doğrulanır.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CreditDisplay } from "@/components/shared/CreditDisplay";
import { qk } from "@/lib/query/keys";
import { mockResponse } from "@/test/http";
import { renderWithIntl } from "@/test/test-utils";

function renderDisplay(initialCredits?: number) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  const view = renderWithIntl(
    <QueryClientProvider client={client}>
      <CreditDisplay {...(initialCredits === undefined ? {} : { initialCredits })} />
    </QueryClientProvider>,
  );
  return { client, ...view };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CreditDisplay", () => {
  it("SSR tohumunu ağa çıkmadan gösterir", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderDisplay(12);

    expect(screen.getByText("Kredi")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tazelemede yeni bakiyeyi yansıtır", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => mockResponse({ credits: 7 })));
    const { client } = renderDisplay(12);

    expect(screen.getByText("12")).toBeInTheDocument();

    await client.refetchQueries({ queryKey: qk.credits() });

    await waitFor(() => expect(screen.getByText("7")).toBeInTheDocument());
  });

  it("düşük bakiyeyi uyarı rengiyle ayırt eder", () => {
    renderDisplay(0);

    expect(screen.getByText("0")).toHaveClass("text-warning");
  });

  it("yeterli bakiyeyi uyarı rengiyle işaretlemez", () => {
    renderDisplay(5);

    expect(screen.getByText("5")).not.toHaveClass("text-warning");
  });

  it("bakiye bilinmiyorsa yer tutucu gösterir", () => {
    vi.stubGlobal("fetch", vi.fn(async () => mockResponse({ detail: "unauthorized" }, 401)));

    renderDisplay(undefined);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
