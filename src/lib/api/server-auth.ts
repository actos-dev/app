/**
 * Sunucu tarafı kimlikli fetch (Faz 3 / Birim 3.2, 3.4).
 *
 * Korumalı sayfaların SSR verisi backend'e giden isteğin `cookie` başlığı
 * ile taşınmalıdır; aksi halde backend `/companies/summary`, `/economy/quotes`
 * ve `/ipos/*` gibi auth isteyen uçlarda 401 döner. Bu modül gelen isteğin
 * `cookie` başlığını `headers()` ile aynen iletir ve `cache: "no-store"` ile
 * kullanıcıya özel verinin paylaşılan önbelleğe düşmesini engeller.
 *
 * `serverApiFetch` (bkz. `./server`) bilinçli olarak çerezsizdir ve YALNIZ
 * public içerik (landing, hakkında, yasal) içindir; ikisi karıştırılmaz.
 *
 * İki varyant vardır:
 *   - `serverAuthApiFetch` — başarısızlıkta `null` (sayfa çökmez).
 *   - `serverAuthApiFetchWithStatus` — durum kodunu da döndürür; `404` ile
 *     `5xx`/ağ kesintisi ayrımı gereken çağrılar (ör. bilinmeyen ticker
 *     doğrulaması) bunu kullanır.
 */
import { headers } from "next/headers";

import { getApiBaseUrl } from "@/lib/auth/constants";

import { parseRetryAfter } from "./rate-limit";
import type { ServerApiOptions, ServerApiPath } from "./server";

function buildUrl(path: ServerApiPath, query: ServerApiOptions["query"]): string {
  const url = `${getApiBaseUrl()}${path}`;
  if (!query) {
    return url;
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) {
      search.set(key, String(value));
    }
  }
  const suffix = search.toString();
  return suffix.length > 0 ? `${url}?${suffix}` : url;
}

/** Gelen isteğin çerez başlığı; istek bağlamı dışında `null`. */
async function readRequestCookie(): Promise<string | null> {
  try {
    return (await headers()).get("cookie");
  } catch {
    // `headers()` istek bağlamı dışında (ör. izole test) çağrılırsa çerezsiz devam et.
    return null;
  }
}

function buildAuthInit(cookie: string | null): RequestInit {
  return {
    headers: { accept: "application/json", ...(cookie ? { cookie } : {}) },
    cache: "no-store",
  };
}

/** Durum kodlu sunucu fetch sonucu. */
export type ServerAuthApiResult<T> = {
  /** HTTP durum kodu; ağ hatasında `0`. */
  status: number;
  /** `2xx` gövdesi, aksi halde `null`. */
  data: T | null;
  /** `429` yanıtında `Retry-After` (saniye); yoksa `null` (X-07). */
  retryAfter: number | null;
};

/**
 * Korumalı ucu sunucudan okur ve durum kodunu ayırt eder.
 *
 * `404` (kaynak yok) ile `5xx`/ağ kesintisi (`status: 0`) ayrılır; çağıran
 * taraf ikisine farklı davranabilir (ör. `404` → `notFound()`).
 */
export async function serverAuthApiFetchWithStatus<T>(
  path: ServerApiPath,
  options: ServerApiOptions = {},
): Promise<ServerAuthApiResult<T>> {
  const cookie = await readRequestCookie();

  try {
    const response = await fetch(buildUrl(path, options.query), buildAuthInit(cookie));
    if (!response.ok) {
      return {
        status: response.status,
        data: null,
        retryAfter: parseRetryAfter(response.headers.get("retry-after")),
      };
    }
    try {
      return { status: response.status, data: (await response.json()) as T, retryAfter: null };
    } catch {
      return { status: response.status, data: null, retryAfter: null };
    }
  } catch {
    return { status: 0, data: null, retryAfter: null };
  }
}

/**
 * Korumalı ucu sunucudan okur; gelen isteğin çerezini iletir.
 *
 * Başarısızlıkta (`2xx` dışı, ağ hatası, JSON çözümleme hatası) `null` döner;
 * çağıran taraf veriyi opsiyonel sayar ve zarif boş/hata durumu gösterir.
 */
export async function serverAuthApiFetch<T>(
  path: ServerApiPath,
  options: ServerApiOptions = {},
): Promise<T | null> {
  const { data } = await serverAuthApiFetchWithStatus<T>(path, options);
  return data;
}
