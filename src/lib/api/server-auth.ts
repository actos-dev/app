/**
 * Sunucu tarafı kimlikli fetch (Faz 3 / Birim 3.2).
 *
 * Korumalı sayfaların SSR verisi backend'e giden isteğin `cookie` başlığı
 * ile taşınmalıdır; aksi halde backend `/companies/summary`, `/economy/quotes`
 * ve `/ipos/*` gibi auth isteyen uçlarda 401 döner. Bu modül gelen isteğin
 * `cookie` başlığını `headers()` ile aynen iletir ve `cache: "no-store"` ile
 * kullanıcıya özel verinin paylaşılan önbelleğe düşmesini engeller.
 *
 * `serverApiFetch` (bkz. `./server`) bilinçli olarak çerezsizdir ve YALNIZ
 * public içerik (landing, hakkında, yasal) içindir; ikisi karıştırılmaz.
 * Hata/ağ kesintisinde `null` döner, böylece sayfa render'ı çökmez.
 */
import { headers } from "next/headers";

import { getApiBaseUrl } from "@/lib/auth/constants";

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
  let cookie: string | null = null;
  try {
    cookie = (await headers()).get("cookie");
  } catch {
    // `headers()` istek bağlamı dışında (ör. izole test) çağrılırsa çerezsiz devam et.
    cookie = null;
  }

  const init: RequestInit = {
    headers: { accept: "application/json", ...(cookie ? { cookie } : {}) },
    cache: "no-store",
  };

  try {
    const response = await fetch(buildUrl(path, options.query), init);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
