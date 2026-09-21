/**
 * İstemci API katmanı (plan §2.4).
 *
 * Tarayıcı yalnız Next origin'ini görür: tüm çağrılar same-origin BFF
 * `/api/v1/*` üzerinden geçer, kimlik httpOnly çerezlerle taşınır. Token
 * JS'e hiçbir zaman girmez.
 *
 * `apiFetch` yol tipi `src/types/generated.ts` (`paths`) anahtarlarına
 * bağlıdır; elle yol yazmak derleme zamanında yakalanır. 401 alınırsa
 * `refreshSessionClient()` ile oturum yenilenir ve istek BİR kez tekrarlanır;
 * yenileme başarısızsa `auth:unauthorized` olayı yayınlanır.
 */
import type { paths } from "@/types/generated";

import { refreshSessionClient } from "./refresh-lock";

/** BFF üzerinden çağrılabilen yollar (`/api/v1/*`). */
export type ApiPath = Extract<keyof paths, `/api/v1/${string}`>;

/** Sorgu parametreleri; `null`/`undefined` değerler atlanır. */
export type ApiQuery = Record<string, string | number | boolean | null | undefined>;

/** Gövde olarak düz nesne verilirse JSON'a çevrilir; diğerleri aynen geçer. */
export type ApiBody = BodyInit | Record<string, unknown> | null;

export type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: ApiBody;
  query?: ApiQuery;
};

/** HTTP hatalarını backend `detail` koduyla taşır. */
export class ApiError extends Error {
  readonly status: number;
  /** Backend `detail` değeri (sabit kod veya düz İngilizce metin). */
  readonly code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const REFRESH_ENDPOINT: ApiPath = "/api/v1/auth/refresh";

/** Gövde olarak `BodyInit` sayılmayan düz nesne mi? */
function isJsonBody(value: ApiBody | undefined): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams) {
    return false;
  }
  if (typeof FormData !== "undefined" && value instanceof FormData) {
    return false;
  }
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return false;
  }
  if (typeof ArrayBuffer !== "undefined" && (value instanceof ArrayBuffer || ArrayBuffer.isView(value))) {
    return false;
  }
  if (typeof ReadableStream !== "undefined" && value instanceof ReadableStream) {
    return false;
  }
  return true;
}

function buildUrl(path: ApiPath, query?: ApiQuery): string {
  if (!query) {
    return path;
  }
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  }
  const search = searchParams.toString();
  return search.length > 0 ? `${path}?${search}` : path;
}

function buildInit(init: Omit<ApiRequestInit, "query">): RequestInit {
  const { body, headers, ...rest } = init;
  const nextHeaders = new Headers(headers);
  if (!nextHeaders.has("accept")) {
    nextHeaders.set("accept", "application/json");
  }

  let payload: BodyInit | null | undefined;
  if (isJsonBody(body)) {
    nextHeaders.set("content-type", "application/json");
    payload = JSON.stringify(body);
  } else {
    payload = body;
  }

  return {
    credentials: "same-origin",
    ...rest,
    headers: nextHeaders,
    ...(payload === undefined ? {} : { body: payload }),
  };
}

async function readDetail(response: Response): Promise<{ code: string; message: string }> {
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    parsed = undefined;
  }
  const raw =
    typeof parsed === "object" && parsed !== null && "detail" in parsed
      ? (parsed as { detail: unknown }).detail
      : parsed;

  if (typeof raw === "string" && raw.length > 0) {
    return { code: raw, message: raw };
  }
  if (Array.isArray(raw)) {
    return { code: "error_validation", message: response.statusText || "Validation error" };
  }
  return { code: "error_unknown", message: response.statusText || `HTTP ${response.status}` };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }
  const text = await response.text();
  if (text.length === 0) {
    return undefined as T;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as T;
    } catch {
      return undefined as T;
    }
  }
  return text as unknown as T;
}

function notifyUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth:unauthorized"));
  }
}

/**
 * BFF üzerinden JSON istek atar.
 *
 * @throws {ApiError} 2xx dışı yanıtlarda; `code` backend `detail` değeridir.
 */
export async function apiFetch<T = unknown>(path: ApiPath, init: ApiRequestInit = {}): Promise<T> {
  const { query, ...requestSource } = init;
  const url = buildUrl(path, query);
  const requestInit = buildInit(requestSource);

  let response = await fetch(url, requestInit);

  if (response.status === 401 && path !== REFRESH_ENDPOINT) {
    const refreshed = await refreshSessionClient();
    if (refreshed) {
      response = await fetch(url, requestInit);
    } else {
      const { code, message } = await readDetail(response);
      notifyUnauthorized();
      throw new ApiError(401, code, message);
    }
  }

  if (!response.ok) {
    const { code, message } = await readDetail(response);
    throw new ApiError(response.status, code, message);
  }

  return parseResponse<T>(response);
}
