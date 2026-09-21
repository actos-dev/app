"use client";

/**
 * Çıkış kancası (Faz 5 / Birim 5A.3, U-11, A3).
 *
 * `POST /api/v1/auth/logout` BFF üzerinden çağrılır; backend access + refresh
 * çerezlerini siler (A3 borcu burada kapanır). Başarıda istemci query
 * önbelleği temizlenir ve varsayılan olarak `/login`e yönlendirilir; hesap
 * silme akışı `redirectTo: "/"` ile ana sayfaya döner. POST başarısızsa oturum
 * hâlâ açık olabileceğinden istemci çıkarılmaz; kullanıcıya hata bildirilir.
 */
import type { Route } from "next";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api/client";
import { LOGOUT_PATH } from "@/lib/auth/api-paths";

/** Çıkış sonrası hedef; hesap silmede `/`e, normal çıkışta `/login`e gidilir. */
type LogoutOptions = {
  redirectTo?: Route;
};

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const t = useTranslations("account");
  const [isPending, setIsPending] = useState(false);

  const logout = async (options: LogoutOptions = {}): Promise<void> => {
    setIsPending(true);
    try {
      await apiFetch(LOGOUT_PATH, { method: "POST" });
    } catch {
      toast.error(t("logoutError"));
      setIsPending(false);
      return;
    }
    queryClient.clear();
    setIsPending(false);
    router.replace(options.redirectTo ?? "/login");
    router.refresh();
  };

  return { logout, isPending };
}
