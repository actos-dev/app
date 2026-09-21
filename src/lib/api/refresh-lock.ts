/**
 * İstemci tarafı oturum yenileme kilidi (plan S-12, §2.3).
 *
 * Access token httpOnly çerezdir; JS onu hiç görmez. 401 alındığında BFF
 * `/api/v1/auth/refresh` çağrılır (refresh çerezi `path=/api/v1/auth` ile
 * eşleştiği için tarayıcı istemci isteğinde de gönderir). Backend refresh
 * token'ı her kullanımda döndürür (rotasyon); iki eşzamanlı yenileme eski
 * token'ı yakalarsa ikincisi 401 alır ve oturum düşer. Bu yüzden:
 *
 *   navigator.locks varsa   → sekmeler arası gerçek serileştirme,
 *   yoksa BroadcastChannel  → sekmeler arası en-iyi-çaba tekilleştirme,
 *   o da yoksa              → yalnız bu sekmede in-memory tek-uçuş.
 *
 * Her durumda aynı sekmedeki eşzamanlı çağrılar tek Promise'i bekler.
 * Token hiçbir yerde saklanmaz; yalnız çerez akışı vardır.
 */

const REFRESH_ENDPOINT = "/api/v1/auth/refresh";
const LOCK_NAME = "florence:auth-refresh";
const CHANNEL_NAME = "florence:auth-refresh";
const DEDUP_WINDOW_MS = 2_000;

/** Aynı sekmedeki eşzamanlı çağrıların paylaştığı tek-uçuş Promise'i. */
let inflight: Promise<boolean> | null = null;

/** BroadcastChannel ile öğrenilen son başarılı yenileme zamanı (ms). */
let lastRefreshedAt = 0;
let channel: BroadcastChannel | null = null;

type RefreshBroadcast = { type: "refresh-complete"; at: number };

function hasWebLocks(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.locks !== "undefined" &&
    typeof navigator.locks.request === "function"
  );
}

function hasBroadcastChannel(): boolean {
  return typeof BroadcastChannel !== "undefined";
}

/** Sekmeler arası "az önce yenilendi" sinyalini dinleyen kanal (tembel). */
function getChannel(): BroadcastChannel | null {
  if (!hasBroadcastChannel()) {
    return null;
  }
  if (channel === null) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", (event: MessageEvent<unknown>) => {
      const data = event.data as RefreshBroadcast | undefined;
      if (data?.type === "refresh-complete" && typeof data.at === "number") {
        lastRefreshedAt = data.at;
      }
    });
  }
  return channel;
}

/** BFF refresh uç noktasına cookie ile POST atar; ağ hatası `false`. */
async function performRefresh(): Promise<boolean> {
  try {
    const response = await fetch(REFRESH_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
      credentials: "same-origin",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Başarılı yenilemeyi diğer sekmelere duyurur. */
function announceRefresh(): void {
  lastRefreshedAt = Date.now();
  const broadcastChannel = getChannel();
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: "refresh-complete", at: lastRefreshedAt } satisfies RefreshBroadcast);
  }
}

/** Bu sekmede (veya duyuruyla başka sekmede) çok yakında yenilendi mi? */
function recentlyRefreshed(): boolean {
  return Date.now() - lastRefreshedAt < DEDUP_WINDOW_MS;
}

async function refreshOnce(): Promise<boolean> {
  if (recentlyRefreshed()) {
    return true;
  }
  const ok = await performRefresh();
  if (ok) {
    announceRefresh();
  }
  return ok;
}

/** Seçili mekanizmaya göre tek bir yenileme çalıştırır. */
async function refreshWithCrossTabLock(): Promise<boolean> {
  if (hasWebLocks()) {
    return navigator.locks.request(LOCK_NAME, async () => {
      // Kilit alındı; başka sekme bu arada yenilemişse yeniden denemeyiz.
      if (recentlyRefreshed()) {
        return true;
      }
      const ok = await performRefresh();
      if (ok) {
        announceRefresh();
      }
      return ok;
    });
  }
  return refreshOnce();
}

/**
 * Oturumu yeniler. Sekme içinde tek-uçuş; sekmeler arası kilit (S-12).
 * Başarıda `true`, ağ/401 hatasında `false` döner (fırlatmaz).
 */
export function refreshSessionClient(): Promise<boolean> {
  if (inflight) {
    return inflight;
  }
  inflight = refreshWithCrossTabLock().finally(() => {
    inflight = null;
  });
  return inflight;
}
