/**
 * Test yardımcısı: `Response` benzeri nesne üretir.
 *
 * jsdom `fetch`/`Response` sağlamadığından `apiFetch` ve refresh katmanı
 * testlerinde elle kurulan yanıtlar kullanılır. Yalnız gerçekten okunan
 * alanlar (`ok`, `status`, `statusText`, `headers`, `text`, `json`) sunulur.
 */
export function mockResponse(body: unknown, status = 200): Response {
  const contentType: Record<string, string> | undefined =
    body === undefined ? undefined : { "content-type": "application/json" };
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    headers: new Headers(contentType),
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
    json: async () => body,
  } as unknown as Response;
}
