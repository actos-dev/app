/**
 * Polling kararı testi (Faz 5B / Birim 5B.1, P-04).
 *
 * `usePollingInterval` paylaşılan `/market/status` sorgusunu okur ve piyasa
 * kapalıyken `false` döner (hiç istek atılmaz), açıkken sabit aralığı verir.
 * Önbellek önceden tohumlandığı için ağ çağrısı yapılmaz.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { OPEN_POLL_INTERVAL_MS, usePollingInterval } from "@/lib/query/polling";
import { qk } from "@/lib/query/keys";
import type { MarketStatus } from "@/types/market";

function status(open: boolean): MarketStatus {
  return {
    open,
    next_open_at: open ? null : "2026-09-23T07:00:00Z",
    timezone: "Europe/Istanbul",
    is_holiday: false,
    holiday_name: null,
    as_of: "2026-09-22T08:00:00Z",
  };
}

function setup(initialStatus: MarketStatus) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  client.setQueryData(qk.marketStatus(), initialStatus);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => usePollingInterval(), { wrapper });
}

describe("usePollingInterval", () => {
  it("piyasa kapalıyken false döner", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = setup(status(false));

    expect(result.current).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("piyasa açıkken sabit aralığı döner", () => {
    const { result } = setup(status(true));

    expect(result.current).toBe(OPEN_POLL_INTERVAL_MS);
  });
});
