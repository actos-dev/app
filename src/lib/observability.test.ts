/**
 * Hata raporlama testleri (plan S-08).
 *
 * `track` mock'lanır; `captureError`'ın olayı doğru alanlarla (message +
 * digest) bıraktığı ve hiçbir girdide fırlatmadığı doğrulanır.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/telemetry", () => ({ track: vi.fn() }));

import { captureError } from "@/lib/observability";
import { track } from "@/lib/telemetry";
import { TelemetryEvents } from "@/lib/telemetry-events";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("captureError", () => {
  it("client_error olayını message ve digest ile bildirir", () => {
    const error = Object.assign(new Error("boom"), { digest: "digest-7" });

    captureError(error, { digest: "digest-7", source: "route-error" });

    expect(track).toHaveBeenCalledWith(
      TelemetryEvents.clientError,
      expect.objectContaining({ message: "boom", digest: "digest-7", source: "route-error" }),
    );
  });

  it("digest bağlamdan yoksa hatadan okur", () => {
    const error = Object.assign(new Error("boom"), { digest: "from-error" });

    captureError(error);

    expect(track).toHaveBeenCalledWith(
      TelemetryEvents.clientError,
      expect.objectContaining({ digest: "from-error" }),
    );
  });

  it("bilinmeyen ve boş girdilerde fırlatmaz", () => {
    expect(() => captureError(undefined)).not.toThrow();
    expect(() => captureError(null)).not.toThrow();
    expect(() => captureError("düz metin")).not.toThrow();
    expect(() => captureError({ weird: true })).not.toThrow();

    expect(track).toHaveBeenCalledTimes(4);
  });
});
