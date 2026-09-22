/**
 * İstemci telemetry istemcisi (plan S-10, S-04, S-09, Faz 6).
 *
 * Sözleşme:
 *   - Rıza kapısı: `hasAnalyticsConsent()` false ise `track` hiçbir şey yapmaz
 *     ve ağa çıkılmaz (S-04). Rıza sonradan geri alınırsa kuyruk atılır.
 *   - Toplu gönderim: olaylar bellekte kuyruğa girer; eşikte, sayfa
 *     gizlenince (`visibilitychange`) veya `pagehide`'da tek seferde
 *     `POST /api/v1/analytics/event` gövdesine (liste) yazılır.
 *   - Taşıma: `navigator.sendBeacon` varsa o; yoksa `fetch(..., keepalive)`.
 *     Gönderim hatası kullanıcıyı asla etkilemez.
 *   - PII YOK: e-posta/kullanıcı adı vb. alanlar gönderimden önce ayıklanır.
 *     Oturum kimliği `sessionStorage`'daki rastgele `sid`'dir; token değildir.
 *
 * Backend `POST /api/v1/analytics/event` gövdesi `list[dict]` bekler ve her
 * kayıtta `event_type`, `ticker`, `details` alanlarını okur; `user_id` sunucuda
 * oturumdan çözülür. Bu yüzden istemci kullanıcı kimliği göndermez.
 */
import { hasAnalyticsConsent } from "@/lib/consent";
import { TelemetryEvents, type TelemetryEvent } from "@/lib/telemetry-events";

/** BFF proxy üzerinden aynı-origin analytics ucu. */
export const ANALYTICS_EVENT_PATH = "/api/v1/analytics/event";

/** Backend tek istekte en fazla 100 olay kabul eder (413 üstünde). */
const BATCH_LIMIT = 100;

/** Rastgele oturum kimliğinin `sessionStorage` anahtarı (token değil). */
const SID_STORAGE_KEY = "florence_sid";

/**
 * Gönderimden önce ayıklanan PII anahtarları (küçük/büyük harf duyarsız).
 * Çağrı yerleri zaten PII geçirmemeli; bu son savunma hattıdır.
 */
const PII_KEYS = new Set([
  "email",
  "e-mail",
  "username",
  "user_name",
  "password",
  "token",
  "access_token",
  "refresh_token",
]);

/** `track` çağrısındaki düz alanlar; `ticker` üst düzeyde ayrılır. */
export type TelemetryProps = Record<string, unknown> & { ticker?: string };

/** Backend'e giden tek olay kaydı. */
export type TelemetryPayload = {
  event_type: TelemetryEvent;
  ticker?: string;
  details: Record<string, unknown>;
};

/** RUM metrikleri için minimal sözleşme (`next/web-vitals` Metric ile uyumlu). */
export type WebVitalMetric = {
  name: string;
  value: number;
  rating?: string;
};

/** RUM olarak raporlanan metrik adları (S-09). */
const WEB_VITAL_NAMES = new Set(["LCP", "INP", "CLS", "FCP", "TTFB"]);

// --- Modül durumu -----------------------------------------------------------
let queue: TelemetryPayload[] = [];
let lifecycleBound = false;

/** PII ve boş değerleri ayıklar (saf). */
function sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || PII_KEYS.has(key.toLowerCase())) {
      continue;
    }
    output[key] = value;
  }
  return output;
}

/** Sunucuda çağrılırsa boş bağlam döner; istemcide sayfa bağlamını toplar. */
function buildContext(): Record<string, unknown> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {};
  }
  const context: Record<string, unknown> = { path: window.location.pathname };
  const locale = document.documentElement.lang;
  if (locale) {
    context.locale = locale;
  }
  const theme = document.documentElement.dataset.theme;
  if (theme) {
    context.theme = theme;
  }
  const sid = getSessionId();
  if (sid) {
    context.sid = sid;
  }
  return context;
}

/** `sessionStorage`'da kalıcı rastgele oturum kimliği; token değildir. */
function getSessionId(): string | undefined {
  try {
    const existing = window.sessionStorage.getItem(SID_STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const bytes = new Uint8Array(16);
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    const sid = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    window.sessionStorage.setItem(SID_STORAGE_KEY, sid);
    return sid;
  } catch {
    // Gizli mod/erişim engeli: sid olmadan devam et, hata yükseltme.
    return undefined;
  }
}

/**
 * Olayı backend gövdesine dönüştürür (saf; test için dışa açık).
 *
 * `ticker` üst düzeye taşınır; kalan alanlar PII ayıklamasından geçip
 * otomatik bağlamla (path/locale/theme/sid) birleştirilir.
 */
export function buildTelemetryPayload(
  event: TelemetryEvent,
  props: TelemetryProps = {},
): TelemetryPayload {
  const { ticker, ...rest } = props;
  const details = { ...sanitizeProps(rest), ...buildContext() };
  return {
    event_type: event,
    ...(typeof ticker === "string" && ticker.length > 0 ? { ticker } : {}),
    details,
  };
}

/** Kuyruğu taşıyıcıya yazar; `sendBeacon` reddederse `fetch`'e düşer. */
function send(events: TelemetryPayload[]): void {
  const body = JSON.stringify(events);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const accepted = navigator.sendBeacon(
        ANALYTICS_EVENT_PATH,
        new Blob([body], { type: "application/json" }),
      );
      if (accepted) {
        return;
      }
    }
  } catch {
    // Beacon başarısız: aşağıda fetch denenir.
  }
  try {
    void fetch(ANALYTICS_EVENT_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      // Analitik kaybı sessizdir; kullanıcıya yansımaz.
    });
  } catch {
    // fetch senkron fırlarsa yut.
  }
}

/** `visibilitychange`/`pagehide` dinleyicileri bir kez bağlanır. */
function bindLifecycle(): void {
  if (lifecycleBound || typeof document === "undefined" || typeof window === "undefined") {
    return;
  }
  lifecycleBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushTelemetry();
    }
  });
  window.addEventListener("pagehide", () => {
    flushTelemetry();
  });
}

/**
 * Kuyruktaki olayları hemen gönderir. Rıza yoksa kuyruk boşaltılır (gönderim
 * yok). Gönderim yan etkisi hata üretmez.
 */
export function flushTelemetry(): void {
  if (queue.length === 0) {
    return;
  }
  if (!hasAnalyticsConsent()) {
    queue = [];
    return;
  }
  const batch = queue.splice(0, BATCH_LIMIT);
  send(batch);
}

/**
 * Tek bir analitik olayı kuyruğa alır. Rıza yoksa veya sunucu tarafındaysa
 * hiçbir şey yapmaz; asla hata fırlatmaz.
 */
export function track(event: TelemetryEvent, props: TelemetryProps = {}): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!hasAnalyticsConsent()) {
    return;
  }
  try {
    queue.push(buildTelemetryPayload(event, props));
    bindLifecycle();
    if (queue.length >= BATCH_LIMIT) {
      flushTelemetry();
    }
  } catch {
    // Telemetry asla ürün akışını bozmaz.
  }
}

/**
 * RUM metriğini `web_vital` olayına eşler (saf). Desteklenmeyen metrikte
 * `null` döner; eşleme `WebVitals` bileşeninden bağımsız test edilebilir.
 */
export function mapWebVital(
  metric: WebVitalMetric,
): { event: TelemetryEvent; props: TelemetryProps } | null {
  if (!WEB_VITAL_NAMES.has(metric.name)) {
    return null;
  }
  return {
    event: TelemetryEvents.webVital,
    props: {
      name: metric.name,
      value: metric.value,
      ...(metric.rating ? { rating: metric.rating } : {}),
    },
  };
}

/** `useReportWebVitals` geri çağrısı; yalnız rıza varsa olayı kuyruğa alır. */
export function reportWebVital(metric: WebVitalMetric): void {
  const mapped = mapWebVital(metric);
  if (mapped) {
    track(mapped.event, mapped.props);
  }
}
