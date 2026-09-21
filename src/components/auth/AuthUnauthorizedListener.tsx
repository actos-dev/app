"use client";

/**
 * `auth:unauthorized` köprüsü (plan S-12, §2.3).
 *
 * `apiFetch` oturumu yenileyemediğinde bu olayı yayınlar; dinleyici kullanıcıyı
 * `?next=` ile login'e taşır. Login sayfasında tekrar yönlendirme döngüsünü
 * önlemek için orada yok sayılır (proxy zaten korumalı sayfaları yönetir).
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AuthUnauthorizedListener() {
  const pathname = usePathname();

  useEffect(() => {
    function handleUnauthorized() {
      if (pathname.startsWith("/login")) {
        return;
      }
      const target = `${pathname}${window.location.search}`;
      // Tam sayfa yükleme bilinçli: istemci durumunu (bellek içi kilitler,
      // açık istekler) sıfırlar; Next client navigasyonu bunu yapmaz.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/login?next=${encodeURIComponent(target)}`);
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [pathname]);

  return null;
}
