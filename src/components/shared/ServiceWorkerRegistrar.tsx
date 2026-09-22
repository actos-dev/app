"use client";

/**
 * Service worker kaydı (Faz 6 / Birim 6.4, plan M-12).
 *
 * Yalnız **üretimde** ve tarayıcı destekliyorsa kaydeder; geliştirme ve test
 * ortamlarında no-op'tur (HMR ve Vitest/Playwright sürtüşmesini önler).
 * Kayıt başarısızlığı sessizce yutulur: SW bir iyileştirmedir, uygulamayı
 * engellememelidir.
 */
import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return null;
}
