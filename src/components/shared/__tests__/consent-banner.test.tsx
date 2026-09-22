/**
 * Çerez izni banner'ı testleri (plan S-04, Faz 6).
 *
 * Kabul/ret akışı, telemetry kapısı ve erişilebilir adlar doğrulanır. Telemetry
 * modülü mock'lanır; amaç banner'ın doğru çağrıları yapmasıdır (kendi kapısı
 * ayrı test edilir).
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setConsentMock = vi.hoisted(() => vi.fn());
const trackMock = vi.hoisted(() => vi.fn());
const flushTelemetryMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/consent", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/consent")>();
  return { ...actual, setConsent: setConsentMock };
});

vi.mock("@/lib/telemetry", () => ({
  track: trackMock,
  flushTelemetry: flushTelemetryMock,
}));

import { ConsentBanner } from "@/components/shared/ConsentBanner";
import { TelemetryEvents } from "@/lib/telemetry-events";
import { renderWithIntl } from "@/test/test-utils";

const REGION = { role: "region", name: "Çerez izni" } as const;

beforeEach(() => {
  setConsentMock.mockClear();
  trackMock.mockClear();
  flushTelemetryMock.mockClear();
});

describe("ConsentBanner", () => {
  it("rıza kararı verilmişse render edilmez", () => {
    renderWithIntl(<ConsentBanner needsConsent={false} />);

    expect(screen.queryByRole(REGION.role, { name: REGION.name })).toBeNull();
  });

  it("karar belirsizken görünür, iki bağlantı ve eşit iki düğme sunar", () => {
    renderWithIntl(<ConsentBanner needsConsent />);

    expect(screen.getByRole(REGION.role, { name: REGION.name })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Çerez Politikası" })).toHaveAttribute(
      "href",
      "/legal/cookie_policy",
    );
    expect(screen.getByRole("link", { name: "Gizlilik Politikası" })).toHaveAttribute(
      "href",
      "/legal/privacy_policy",
    );

    const reject = screen.getByRole("button", { name: "Yalnızca gerekli" });
    const accept = screen.getByRole("button", { name: "Kabul et" });
    // Dark pattern yok: iki seçenek aynı görsel ağırlıkta (secondary).
    expect(reject.className).toContain("bg-surface");
    expect(accept.className).toContain("bg-surface");
  });

  it("reddedilince rıza kapalı kalır, telemetry çağrılmaz ve banner kaybolur", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ConsentBanner needsConsent />);

    await user.click(screen.getByRole("button", { name: "Yalnızca gerekli" }));

    expect(setConsentMock).toHaveBeenCalledWith({ analytics: false });
    expect(trackMock).not.toHaveBeenCalled();
    expect(flushTelemetryMock).not.toHaveBeenCalled();
    expect(screen.queryByRole(REGION.role, { name: REGION.name })).toBeNull();
  });

  it("kabul edilince rıza açılır, consent_updated gönderilir ve banner kaybolur", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ConsentBanner needsConsent />);

    await user.click(screen.getByRole("button", { name: "Kabul et" }));

    expect(setConsentMock).toHaveBeenCalledWith({ analytics: true });
    expect(trackMock).toHaveBeenCalledWith(TelemetryEvents.consentUpdated, { granted: true });
    expect(flushTelemetryMock).toHaveBeenCalledOnce();
    expect(screen.queryByRole(REGION.role, { name: REGION.name })).toBeNull();
  });
});
