/**
 * Hata gözlemlenebilirliği (plan S-08, Faz 6).
 *
 * Tek giriş noktası: `captureError`. Şimdilik olayı telemetry kuyruğuna
 * (`client_error`) bırakır; kullanıcıya gösterilen `errorId`/`digest`
 * KORUNUR. Sentry/GlitchTip paketi bilinçli olarak EKLENMEDİ: yalnızca DSN
 * varlığı kontrol edilir ve gerçek aktarım için tek bir adaptör noktası
 * bırakılır. DSN tanımlanınca `forwardToSentry` genişletilecek.
 *
 * `captureError` hiçbir koşulda hata fırlatmaz; hata sınırları içinde
 * güvenle çağrılabilir.
 */
import { TelemetryEvents } from "@/lib/telemetry-events";
import { track } from "@/lib/telemetry";

/** Hata bağlamı; `digest` Next'in sunucu log kimliğidir. */
export type ErrorContext = {
  digest?: string;
  path?: string;
  /** Hatanın kaynağı (ör. "route-error", "global-error"). */
  source?: string;
};

/** Sentry/GlitchTip DSN'i tanımlı mı? (paket henüz yok, yalnız kontrol). */
export function isSentryConfigured(): boolean {
  if (typeof process === "undefined") {
    return false;
  }
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN);
}

/** Bilinmeyen hatadan okunabilir bir mesaj çıkarır (stack gönderilmez). */
function readErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.length > 0) {
    return error;
  }
  return "unknown_error";
}

/** Hatadan `digest` (varsa) okur; Next `Error & { digest?: string }` kullanır. */
function readDigest(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "digest" in error) {
    const digest = (error as { digest?: unknown }).digest;
    if (typeof digest === "string" && digest.length > 0) {
      return digest;
    }
  }
  return undefined;
}

function readPath(explicit?: string): string | undefined {
  if (explicit) {
    return explicit;
  }
  if (typeof window !== "undefined") {
    return window.location.pathname;
  }
  return undefined;
}

/**
 * Sentry/GlitchTip adaptör noktası. Paket eklenene kadar DSN yoksa no-op.
 * İleride: `Sentry.captureException(error, { extra: { digest, path } })`.
 */
function forwardToSentry(error: unknown, context: ErrorContext): void {
  if (!isSentryConfigured()) {
    return;
  }
  // DSN tanımlı olsa bile paket bilinçli olarak eklenmedi; burada gerçek
  // istemci başlatılana kadar hiçbir şey yapılmaz.
  void error;
  void context;
}

/**
 * İstemci hatasını raporlar. `digest` önce bağlamdan, yoksa hatanın kendi
 * alanından okunur; PII gönderilmez. Hata fırlatmaz.
 */
export function captureError(error: unknown, context: ErrorContext = {}): void {
  try {
    const digest = context.digest ?? readDigest(error);
    const path = readPath(context.path);
    const props: Record<string, unknown> = { message: readErrorMessage(error) };
    if (digest) {
      props.digest = digest;
    }
    if (path) {
      props.path = path;
    }
    if (context.source) {
      props.source = context.source;
    }
    track(TelemetryEvents.clientError, props);
    forwardToSentry(error, context);
  } catch {
    // Gözlemlenebilirlik katmanı asla hatayı büyütmez.
  }
}
