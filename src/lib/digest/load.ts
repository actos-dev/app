/**
 * Bülten sunucu yükleyicileri (Faz 5 / Birim 5A.3, U-08, S-15; 5C / X-05).
 *
 * `serverApiFetchWithStatus` kullanılır: ÇEREZSİZ (public) istek atılır ve
 * durum kodu ayırt edilir; böylece "gerçekten bülten yok" (404 / boş dizi) ile
 * "backend'e ulaşılamadı" (5xx/ağ) ayrı gösterilir (yanıltıcı boş durum yok).
 * `revalidate` ile yanıtlar paylaşılan önbelleğe girebilir.
 */
import { serverApiFetchWithStatus } from "@/lib/api/server";

import { digestServerPath } from "./api-paths";
import { resolveDigestFreshness, type DigestFreshness } from "./digest";
import type { Digest, DigestSlot } from "./types";

export type CurrentDigestResult = {
  digest: Digest | null;
  freshness: DigestFreshness;
  /** Backend hatası (5xx/ağ); boş durumdan ayırmak için. */
  failed: boolean;
};

/**
 * Güncel bülteni getirir ve tazeliğini belirler.
 *
 * Tazelik, backend'e "şu an hangi pencere?" sorusuyla ölçülür
 * (`GET /digest?at=`); uydurma slot sınırı kullanılmaz. İki istek paraleldir.
 */
/** Bülten ISR süresi (saniye). */
const DIGEST_CURRENT_CACHE_SECONDS = 60;

export async function loadCurrentDigest(): Promise<CurrentDigestResult> {
  const at = new Date().toISOString();
  const [current, windowResult] = await Promise.all([
    serverApiFetchWithStatus<Digest>(digestServerPath(), {
      revalidate: DIGEST_CURRENT_CACHE_SECONDS,
    }),
    serverApiFetchWithStatus<Digest>(digestServerPath(), {
      revalidate: DIGEST_CURRENT_CACHE_SECONDS,
      query: { at },
    }),
  ]);

  const digest = current.data;
  if (!digest) {
    return { digest: null, freshness: "unknown", failed: current.status !== 404 };
  }
  return {
    digest,
    freshness: resolveDigestFreshness(digest, windowResult),
    failed: false,
  };
}

export type DigestArchiveResult = {
  status: "ok" | "error";
  digests: Digest[];
};

/** Bir günün tüm bültenlerini getirir; boş dizi geçerli bir sonuçtur. */
export async function loadDigestArchive(date: string): Promise<DigestArchiveResult> {
  const result = await serverApiFetchWithStatus<Digest[]>(digestServerPath(), {
    revalidate: DIGEST_CURRENT_CACHE_SECONDS,
    query: { date },
  });
  if (result.status >= 200 && result.status < 300 && Array.isArray(result.data)) {
    return { status: "ok", digests: result.data };
  }
  return { status: "error", digests: [] };
}

export type DigestSlotResult =
  | { status: "ok"; digest: Digest }
  | { status: "not-found"; digest: null }
  | { status: "error"; digest: null };

/** `date + slot` ile tek bülten getirir; 404 ile 5xx ayrılır. */
export async function loadDigestBySlot(date: string, slot: DigestSlot): Promise<DigestSlotResult> {
  const result = await serverApiFetchWithStatus<Digest>(digestServerPath(), {
    revalidate: DIGEST_CURRENT_CACHE_SECONDS,
    query: { date, slot },
  });
  if (result.status === 404) {
    return { status: "not-found", digest: null };
  }
  if (result.status >= 200 && result.status < 300 && result.data) {
    return { status: "ok", digest: result.data };
  }
  return { status: "error", digest: null };
}
