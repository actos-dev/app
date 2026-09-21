# 0007 — BFF proxy ve sunucu oturum katmanı (B-03 fallback)

**Durum:** Kabul edildi · **Tarih:** 2026-09-21

## Bağlam

Cookie modeli değişmiyor: httpOnly `access_token` (path `/`, 1s) + `refresh_token` (path
`/api/v1/auth`, 30g). B-03 (backend `JWT_SECRET` paylaşımı) henüz karara bağlanmadı; bu yüzden
Proxy access token imzasını **yerel doğrulayamıyor**. Yine de korumalı sayfa render'ından önce
hızlı bir kapı gerekiyor (plan M-02/M-03, S-01/S-02/S-12).

## Karar

- **Proxy (Next 16):** `middleware.ts` değil **`src/proxy.ts`** ve `export function proxy`; Next 16
  varsayılanı Node.js runtime. İmza doğrulanmaz; yalnız `exp` imzasız okunur (`src/lib/auth/jwt.ts`).
  Süresi dolmuş/eksikse refresh çerezi varsa backend'den yenilenir, başarısızsa çerezler temizlenip
  `/login?next=...`'e 307 yönlendirilir. Gerçek yetki kararı backend'de kalır.
- **Gerçek doğrulama:** `getSession()` (React `cache`, istek başına bir kez) access token çereziyle
  backend `GET /api/v1/profile` çağırır; 401/404/ağ hatası `null`. `(app)/layout.tsx` ikinci savunma
  katmanı olarak bunu kullanır.
- **BFF:** `src/app/api/v1/[...path]/route.ts` yalnız allowlist başlıkları (`cookie`,
  `content-type`, `accept`, `authorization`) iletir; `host`/`connection` gibi hop-by-hop başlıklar
  geçmez. Çoklu `Set-Cookie` korunur (login/logout/refresh). `API_BASE_URL` (varsayılan
  `http://localhost:7055`).
- **CSRF (S-01):** Mutasyon metotlarında `Origin` farklıysa veya `Sec-Fetch-Site: cross-site` ise
  403. **Open redirect (S-02):** `sanitizeNextPath` yalnız `/` ile başlayan, `//` ve `\` içermeyen
  yolları kabul eder; aksi halde `/dashboard`.
- **Refresh yarışı (S-12):** `refreshSession` tek istekte çalışır; rotasyon backend'de. Proxy'nin
  yenilediği çerezler hem yanıta hem istek `cookie` başlığına yazılır ki aynı istekteki SSR
  güncel token'ı görsün. Çoklu sekme için BroadcastChannel kilidi v1 kapsamında ayrıca eklenecek.

## Sonuçlar

- Refresh çerezi `path=/api/v1/auth` olduğundan tarayıcı onu `/dashboard` isteğinde göndermediği
  için Proxy'deki yenileme pratikte nadiren tetiklenir; asıl yenileme BFF çağrısına düşer. Çerez
  path'i genişlerse Proxy mantığı değişmeden devreye girer.
- Backend kapalıyken `/profile` başarısız olur ve korumalı sayfalar login'e yönlenir (kabul
  edilen geçici davranış; S-11 offline UX'i bunu yumuşatacak).
- `JWT_SECRET` paylaşılırsa yalnız `jwt.ts`'e `jose.verify` eklenir; rotalar değişmez.

## Alternatifler

- **`jose` ile yerel HS256 doğrulama:** B-03 secret'ı olmadan mümkün değil; secret gelince
  hızlandırma yolu olarak açık.
- **Her istekte `/profile`:** Korumalı sayfa başına ekstra tur; reddedildi.
- **İstemci taraflı auth:** Plan §11 ile çelişir; token JS'e sızmaz.
