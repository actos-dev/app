/**
 * Oturum bekçisi testleri (plan S-12).
 *
 * Fake timers ile zamanlanan yenileme ve gizli sekmede erteleme davranışı;
 * `refreshSessionClient` mock'lanır.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/refresh-lock", () => ({
  refreshSessionClient: refreshMock,
}));

import { SessionKeeper } from "@/components/auth/SessionKeeper";

function setVisibility(value: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => value,
  });
}

describe("SessionKeeper", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    Reflect.deleteProperty(document, "visibilityState");
  });

  it("exp süresinden 2 dakika önce yenilemeyi planlar", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T10:00:00.000Z"));
    refreshMock.mockResolvedValue(true);
    setVisibility("visible");

    const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60;
    render(<SessionKeeper expiresAt={expiresAt} />);

    await act(async () => {
      vi.advanceTimersByTime(8 * 60 * 1000);
    });

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("gizli sekmede erteler, görünür olunca yeniler", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T10:00:00.000Z"));
    refreshMock.mockResolvedValue(true);
    setVisibility("hidden");

    const expiresAt = Math.floor(Date.now() / 1000) + 60;
    render(<SessionKeeper expiresAt={expiresAt} />);

    await act(async () => {
      vi.advanceTimersByTime(60 * 60 * 1000);
    });
    expect(refreshMock).not.toHaveBeenCalled();

    setVisibility("visible");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(1);
    });

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("exp bilinmiyorsa hiç planlamaz", async () => {
    vi.useFakeTimers();
    refreshMock.mockResolvedValue(true);
    setVisibility("visible");

    render(<SessionKeeper expiresAt={null} />);

    await act(async () => {
      vi.advanceTimersByTime(60 * 60 * 1000);
    });

    expect(refreshMock).not.toHaveBeenCalled();
  });
});
