"use client";

/**
 * Oturum bekçisi (plan §2.3, S-12).
 *
 * `(app)` layout'u oturum varken render eder. Access token'ın `exp` değeri
 * sunucudan prop olarak gelir (`getAccessTokenExpiry`); token süresi bitmeden
 * 2 dakika önce kilitli yenileme tetiklenir. Sekme gizliyken zamanlama
 * atlanır, görünür olunca kontrol edilir. Yenileme başarısızsa hiçbir şey
 * yapılmaz; `src/proxy.ts` bir sonraki istekte zaten login'e yönlendirir.
 */
import { useEffect } from "react";

import { refreshSessionClient } from "@/lib/api/refresh-lock";

/** Süre bitiminden bu kadar önce yenile (2 dakika). */
const REFRESH_MARGIN_MS = 2 * 60 * 1000;

/** Başarılı yenilemeden sonra bir sonraki kontrol (access token ömrü ~1 saat). */
const RESCHEDULE_DELAY_MS = 50 * 60 * 1000;

type SessionKeeperProps = {
  /** Access token `exp` (Unix saniye) veya okunamadıysa `null`. */
  expiresAt: number | null;
};

export function SessionKeeper({ expiresAt }: SessionKeeperProps) {
  useEffect(() => {
    if (expiresAt === null) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const schedule = (delayMs: number) => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        void run();
      }, Math.max(delayMs, 0));
    };

    const run = async () => {
      if (disposed) {
        return;
      }
      const refreshed = await refreshSessionClient();
      if (!refreshed || disposed) {
        return;
      }
      schedule(RESCHEDULE_DELAY_MS);
    };

    const plan = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      schedule(expiresAt * 1000 - Date.now() - REFRESH_MARGIN_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        plan();
      }
    };

    plan();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [expiresAt]);

  return null;
}
