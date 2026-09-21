/**
 * Sunucu tarafı oturum doğrulaması (plan §2.3, B-03 fallback).
 *
 * `getSession()` access token çereziyle backend `GET /api/v1/profile` çağırır
 * ve sonucu istek başına bir kez çalışacak şekilde `React.cache` ile sarar
 * (korumalı layout + sayfalar aynı istekte tekrar tekrar çağırsa da tek tur).
 *
 * `access_token`'ın kendisi httpOnly'dir; bu modül token'ı asla client'a
 * sızdırmaz, yalnızca sunucuda çerez başlığı olarak iletir.
 */
import { cache } from "react";
import { cookies } from "next/headers";

import type { paths } from "@/types/generated";

import { ACCESS_TOKEN_COOKIE, getApiBaseUrl } from "./constants";

// Backend bu uç için response_model tanımlamadığından `generated.ts` şu an
// `unknown` döner; tip yine tek kaynaktan (generated.ts) alınır.
type ProfileResponse =
  paths["/api/v1/profile"]["get"]["responses"][200]["content"]["application/json"];

/** `getSession()` başarılı yanıtı; backend şeması netleşince daralacak. */
export type Session = ProfileResponse;

/**
 * İstek başına bir kez çalışır. Access token yoksa veya backend 401/404/ağ
 * hatası dönerse `null` (çağıran yönlendirme kararı verir).
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/profile`, {
      headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    // Backend kapalı/DNS hatası: oturum doğrulanamaz; güvenli taraf null.
    return null;
  }
});

// Proxy (`src/proxy.ts`) bu yardımcıları session.ts üzerinden alabilir; ağ ve
// `next/headers` yan etkisi olmayan saf uygulamalar `jwt.ts`/`next-path.ts`'te.
export { getAccessTokenExpiry, isAccessTokenExpired } from "./jwt";
export { buildLoginRedirect, DEFAULT_NEXT_PATH, sanitizeNextPath } from "./next-path";
export type { NormalizedCookie, RefreshResult } from "./refresh";
export { refreshSession } from "./refresh";
