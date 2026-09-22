/**
 * Service worker kayıt testleri (Faz 6 / Birim 6.4, plan M-12).
 *
 * Kayıt yalnız üretimde ve tarayıcı destekliyorsa yapılmalıdır; test/dev
 * ortamında `navigator.serviceWorker.register` çağrılmamalıdır.
 */
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServiceWorkerRegistrar } from "@/components/shared/ServiceWorkerRegistrar";

function stubServiceWorker(register: ReturnType<typeof vi.fn>): void {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  });
}

describe("ServiceWorkerRegistrar (6.4)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    Reflect.deleteProperty(navigator, "serviceWorker");
  });

  it("test/dev ortamında kayıt yapmaz", async () => {
    const register = vi.fn();
    stubServiceWorker(register);

    render(<ServiceWorkerRegistrar />);

    await waitFor(() => expect(register).not.toHaveBeenCalled());
  });

  it("üretimde ve destekliyorsa /sw.js kaydeder", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const register = vi.fn().mockResolvedValue(undefined);
    stubServiceWorker(register);

    render(<ServiceWorkerRegistrar />);

    await waitFor(() => expect(register).toHaveBeenCalledWith("/sw.js"));
  });
});
