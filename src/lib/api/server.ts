/**
 * Sunucu tarafı public içerik fetch'i (plan §2.2, §2.4).
 *
 * Public sayfalar (landing, hakkında, iletişim, yasal) içeriği SSR/SSG ile
 * gelsin diye backend'in açık uçlarını doğrudan çağırır. İstemci `client.ts`
 * aksine:
 *   - BFF'yi değil `API_BASE_URL`'i hedefler,
 *   - çerez FORWARD ETMEZ (anonim içerik; kullanıcı verisi sızmaz),
 *   - hata/ağ kesintisinde `null` döner, böylece sayfa render'ı çökmez.
 *
 * Yol tipi `src/types/generated.ts` anahtarlarına bağlıdır; elle yol yazmak
 * derleme zamanında yakalanır.
 */
import type { paths } from "@/types/generated";

import { getApiBaseUrl } from "@/lib/auth/constants";

/** Sunucudan çağrılabilen yollar (`/api/v1/*`). */
export type ServerApiPath = Extract<keyof paths, `/api/v1/${string}`>;

export type ServerApiOptions = {
  /** ISR süresi (saniye); `false` önbelleği kapatır. Verilmezse `no-store`. */
  revalidate?: number | false;
  /** Basit sorgu parametreleri; `null`/`undefined` atlanır. */
  query?: Record<string, string | number | boolean | null | undefined>;
};

type ServerFetchInit = RequestInit & { next?: { revalidate?: number | false } };

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
 * Public ucu sunucudan okur. Başarısızlıkta (`2xx` dışı, ağ hatası, JSON
 * çözümleme hatası) `null` döner; çağıran taraf içeriği opsiyonel sayar.
 */
export async function serverApiFetch<T>(
  path: ServerApiPath,
  options: ServerApiOptions = {},
): Promise<T | null> {
  const init: ServerFetchInit = {
    headers: { accept: "application/json" },
    ...(options.revalidate === undefined
      ? { cache: "no-store" }
      : { next: { revalidate: options.revalidate } }),
  };

  try {
    const response = await fetch(buildUrl(path, options.query), init);
    if (!response.ok) {
      return null;
    }
    const data: T = await response.json();
    return data;
  } catch {
    return null;
  }
}
