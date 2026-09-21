/**
 * BFF proxy (plan M-02, §2.3).
 *
 * Tarayıcı yalnız Next origin'ini görür; `/api/v1/*` burada backend'e
 * proxy'lenir. Böylece:
 *   - CORS gerekmez (same-origin),
 *   - refresh çerezinin `path=/api/v1/auth` kısıtı doğal uyar (tarayıcı bu
 *     yola çerezi kendiliğinden ekler; BFF `cookie` başlığını aynen iletir),
 *   - backend `Set-Cookie`'leri (login/logout/refresh) olduğu gibi aktarılır.
 *
 * Güvenlik (S-01): mutasyon metotlarında `Origin`/`Sec-Fetch-Site` aynı-origin
 * değilse 403. Hop-by-hop başlıklar (`host`, `connection`, ...) iletilmez.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getApiBaseUrl } from "@/lib/auth/constants";
import { getSetCookieHeaders } from "@/lib/auth/refresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Backend'e iletilecek istek başlıkları (allowlist; `host` dahil değil). */
const REQUEST_HEADER_ALLOWLIST = [
  "cookie",
  "content-type",
  "accept",
  "accept-language",
  "authorization",
] as const;

/** Tarayıcıya aktarılacak yanıt başlıkları (`set-cookie` ayrıca işlenir). */
const RESPONSE_HEADER_ALLOWLIST = [
  "content-type",
  "content-disposition",
  "cache-control",
  "retry-after",
  "www-authenticate",
] as const;

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type ProxyContext = { params: Promise<{ path: string[] }> };

/**
 * Tarayıcı kaynaklı CSRF denemesi mi? `Origin` varsa Next origin'iyle
 * eşleşmeli; `Sec-Fetch-Site: cross-site` ise reddedilir. İki başlık da yoksa
 * (tarayıcı dışı istemci, ör. curl) izin verilir.
 */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return false;
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return false;
  }
  return true;
}

async function handle(request: NextRequest, context: ProxyContext): Promise<Response> {
  const { path } = await context.params;

  if (MUTATION_METHODS.has(request.method) && !isSameOrigin(request)) {
    return NextResponse.json({ detail: "error_csrf_origin_mismatch" }, { status: 403 });
  }

  const target = new URL(
    `${getApiBaseUrl()}/api/v1/${path.map((segment) => encodeURIComponent(segment)).join("/")}`,
  );
  target.search = request.nextUrl.search;

  const headers = new Headers();
  for (const name of REQUEST_HEADER_ALLOWLIST) {
    const value = request.headers.get(name);
    if (value !== null) {
      headers.set(name, value);
    }
  }

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };
  if (BODY_METHODS.has(request.method) && request.body) {
    init.body = request.body;
    // Node fetch, ReadableStream gövde için `duplex` şart koşar (stream proxy).
    init.duplex = "half";
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(target, init);
  } catch {
    // Backend kapalı/timeout: 502, çökme yok (S-11 offline UX temeli).
    return NextResponse.json({ detail: "error_backend_unreachable" }, { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const name of RESPONSE_HEADER_ALLOWLIST) {
    const value = backendResponse.headers.get(name);
    if (value !== null) {
      responseHeaders.set(name, value);
    }
  }
  // Çoklu `Set-Cookie` korunur; login/logout/refresh buna bağlı.
  for (const setCookie of getSetCookieHeaders(backendResponse.headers)) {
    responseHeaders.append("set-cookie", setCookie);
  }

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export const GET = handle;
export const HEAD = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
