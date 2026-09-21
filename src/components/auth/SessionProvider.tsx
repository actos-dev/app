"use client";

/**
 * İstemci oturum bağlamı ve aksiyon kapısı (Faz 5C / Birim 5C.2a, X-03, X-04).
 *
 * Sunucu (`AppShell`) oturumu `getSession()` ile çözer ve `session` prop'uyla
 * geçirir; istemci ağacındaki bileşenler buradan okur. Token JS'e girmez,
 * yalnızca "oturum var mı + kullanıcı nesnesi" taşınır.
 *
 * Tasarım kararı: `SessionProvider` YOKSA `useSession()` `null` döner ve
 * aksiyon kapısı UYGULANMAZ. Böylece izole birim testleri ve provider'sız
 * kullanımlar mevcut davranışını korur; üretimde her `(app)` sayfası
 * `AppShell` içinde olduğundan bağlam her zaman mevcuttur. Bu durumda bile
 * gerçek yetki backend'de kalır: korumalı uç anonime `401` döner.
 */
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

import { buildLoginRedirect } from "@/lib/auth/next-path";

/** Sunucudan gelen oturum bilgisi. `user` backend şeması `unknown` olduğundan açık bırakılır. */
export type Session = {
  authenticated: boolean;
  user?: unknown;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  session: Session;
  children: ReactNode;
}) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

/** Provider yoksa `null` (kapı uygulanmaz). Bkz. dosya başındaki karar notu. */
export function useSession(): Session | null {
  return useContext(SessionContext);
}

/** Mevcut yol + sorguyu `/login?next=...` hedefine çevirir. */
function currentLoginHref(): string {
  if (typeof window === "undefined") {
    return buildLoginRedirect("/dashboard");
  }
  return buildLoginRedirect(window.location.pathname, window.location.search);
}

/**
 * Korumalı aksiyonları saran kapı.
 *
 * Anonim kullanıcı (provider var ve `authenticated === false`) aksiyona
 * basınca `/login?next=<mevcut yol>`'a yönlendirilir; oturumlu kullanıcıda
 * aksiyon çalışır. Provider yoksa aksiyon doğrudan çalışır.
 */
export function useRequireAuth(): (action: () => void) => void {
  const session = useSession();
  const router = useRouter();

  return useCallback(
    (action: () => void) => {
      if (session && !session.authenticated) {
        router.push(currentLoginHref() as Route);
        return;
      }
      action();
    },
    [session, router],
  );
}

type RequireAuthProps = {
  children: ReactNode;
  /** Anonimde yönlendirme gerçekleşene kadar gösterilecek içerik. */
  fallback?: ReactNode;
};

/**
 * Yalnız oturumlu kullanıcıya içerik gösterir; anonimde login'e yönlendirir.
 *
 * Birincil kapı sunucudur (`(private)` layout + Proxy); bu bileşen istemci
 * adalarında ek savunma ve içerik gizleme içindir.
 */
export function RequireAuth({ children, fallback = null }: RequireAuthProps) {
  const session = useSession();
  const router = useRouter();
  const blocked = session !== null && !session.authenticated;

  useEffect(() => {
    if (blocked) {
      router.replace(currentLoginHref() as Route);
    }
  }, [blocked, router]);

  if (blocked) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
