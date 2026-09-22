/**
 * Telemetry istemcisi testleri (plan S-10, S-04, S-09).
 *
 * Kritik güvence: rıza yokken ağa HİÇ çıkılmaz. Rıza varken olaylar kuyruğa
 * girip toplu gönderilir; PII ayıklanır; web-vital eşlemesi doğrudur.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CONSENT_COOKIE, setConsent } from "@/lib/consent";

/** `navigator.sendBeacon` yokluğunda kullanılan fetch mock'u. */
function installBeacon(accepted = true) {
  const sendBeacon = vi.fn(() => accepted);
  Object.defineProperty(window.navigator, "sendBeacon", {
    value: sendBeacon,
    configurable: true,
    writable: true,
  });
  return sendBeacon;
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

afterEach(() => {
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0`;
  vi.unstubAllGlobals();
});

describe("track rıza kapısı", () => {
  it("rıza yokken hiçbir istek yapmaz", async () => {
    const sendBeacon = installBeacon();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { track, flushTelemetry } = await import("@/lib/telemetry");
    const { TelemetryEvents } = await import("@/lib/telemetry-events");

    track(TelemetryEvents.loginSuccess);
    flushTelemetry();

    expect(sendBeacon).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("track kuyruk ve flush", () => {
  it("rıza varsa olayı kuyruğa alır, flush sendBeacon ile gönderir", async () => {
    setConsent({ analytics: true });
    const sendBeacon = installBeacon(true);

    const { track, flushTelemetry } = await import("@/lib/telemetry");
    const { TelemetryEvents } = await import("@/lib/telemetry-events");

    track(TelemetryEvents.favoriteToggle, { ticker: "THYAO", action: "added" });
    expect(sendBeacon).not.toHaveBeenCalled();

    flushTelemetry();

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [url, body] = sendBeacon.mock.calls[0] as unknown as [string, Blob];
    expect(url).toBe("/api/v1/analytics/event");
    expect(body).toBeInstanceOf(Blob);

    const text = await body.text();
    const events = JSON.parse(text) as Array<{ event_type: string; details: Record<string, unknown> }>;
    expect(events).toHaveLength(1);
    expect(events[0]?.event_type).toBe("favorite_toggle");
    expect(events[0]?.details.action).toBe("added");
    expect(events[0]?.details.path).toBe(window.location.pathname);
  });

  it("sendBeacon reddederse fetch keepalive ile gönderir", async () => {
    setConsent({ analytics: true });
    installBeacon(false);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const { track, flushTelemetry } = await import("@/lib/telemetry");
    const { TelemetryEvents } = await import("@/lib/telemetry-events");

    track(TelemetryEvents.loginSuccess);
    flushTelemetry();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/analytics/event");
    expect(init.keepalive).toBe(true);
    expect(init.method).toBe("POST");
  });

  it("sayfa gizlenince (visibilitychange) kuyruğu boşaltır", async () => {
    setConsent({ analytics: true });
    const sendBeacon = installBeacon(true);

    const { track } = await import("@/lib/telemetry");
    const { TelemetryEvents } = await import("@/lib/telemetry-events");

    track(TelemetryEvents.pageView);
    expect(sendBeacon).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });
});

describe("PII koruması", () => {
  it("e-posta/kullanıcı adı/parola gönderilmez", async () => {
    const { buildTelemetryPayload } = await import("@/lib/telemetry");
    const { TelemetryEvents } = await import("@/lib/telemetry-events");

    const payload = buildTelemetryPayload(TelemetryEvents.loginSuccess, {
      email: "gizli@example.com",
      username: "efe",
      password: "s3cret",
      token: "access-token",
      ticker: "THYAO",
    });

    expect(payload.ticker).toBe("THYAO");
    expect(payload.details).not.toHaveProperty("email");
    expect(payload.details).not.toHaveProperty("username");
    expect(payload.details).not.toHaveProperty("password");
    expect(payload.details).not.toHaveProperty("token");
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("gizli@example.com");
    expect(serialized).not.toContain("s3cret");
  });
});

describe("web-vitals eşlemesi", () => {
  it("bilinen metriği web_vital olayına çevirir", async () => {
    const { mapWebVital } = await import("@/lib/telemetry");

    expect(mapWebVital({ name: "LCP", value: 1234, rating: "good" })).toEqual({
      event: "web_vital",
      props: { name: "LCP", value: 1234, rating: "good" },
    });
    expect(mapWebVital({ name: "CLS", value: 0.05, rating: "good" })).toEqual({
      event: "web_vital",
      props: { name: "CLS", value: 0.05, rating: "good" },
    });
  });

  it("bilinmeyen metriği atlar", async () => {
    const { mapWebVital } = await import("@/lib/telemetry");
    expect(mapWebVital({ name: "FID", value: 10 })).toBeNull();
  });
});
