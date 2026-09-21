# Backend İş Emri — Florence App (Faz 0 sözleşmeleri)

**Kaynak:** [`../WEB_REFACTOR_PLAN.md`](../WEB_REFACTOR_PLAN.md) §5-B ve §7 (Faz 0).
**Hedef repo:** `project-florence/backend` (bu doküman yalnız isteği tanımlar; `backend/` altına
bu repo'dan dokunulmaz).
**Durum:** Frontend Faz 0'da; aşağıdaki eksikler imzalanmadan ilgili fazlara geçilmez.

Öncelik: **P1** = v1 blokeri, **P2** = v1 içinde gerekli, **P3** = v1.1.
Efor: **S** ≤ 1 gün, **M** 1-3 gün, **L** 3+ gün. "Bloke ettiği" kolonu, uç gelmezse
frontend'te hangi maddenin askıya alındığını gösterir.

## 1. Hazır olan uçlar (backend işi yok, frontend kullanacak)

| Uç | Kullanım |
|---|---|
| `GET /economy/quotes?group=&symbols=` | Döviz/metal kartları tek istekten beslenir (P-02); kart başına `/price/current` biter. |
| `GET /companies/summary?tickers=A,B,C&sort=` | Favoriler, watchlist ve hisse listeleri batch özet (4 farklı query key ailesi tekilleşir). |
| `GET /digest?date=&slot=&at=` | Bülten arşivi gezgini tamamen frontend işi (U-08). |
| `GET /market/status` | `open`, `next_open_at`, `timezone`, `is_holiday`, `holiday_name`; global saat pill'i ve al/sat uyarısı (U-04). |
| `GET /auth/verify-email`, `POST /auth/resend-verification` | Kayıt → doğrulama ekranı; backend'siz çözülür (U-01). |
| Portföy analitiği (valuation, diversification, performers, history, returns, risk, benchmark, CSV) | Faz 4 portföy çalışma alanı. |
| Export merkezi, duyurular, botlar, `user_preferences`, legal/about/contact/version/maintenance | SSR public içerik ve profil. |

**Not:** `GET /data/daily/{year}` bilinçli olarak 410'dur; frontend `POST /data/export` kullanır.

## 2. Eksik işler

### B-02 — `refresh_token` çerez path'i (Faz 2.1 bulgusu, öneri)

- **Bulgu:** `refresh_token` çerezi `path=/api/v1/auth` ile yazılıyor. Tarayıcı bu çerezi **sayfa isteklerinde** (`/dashboard`, `/markets` …) göndermiyor; yalnız `/api/v1/auth/*` isteklerinde gönderiyor. Sonuç: access token (1 saat) süresi dolduğunda sunucu tarafı (Next `proxy.ts`) refresh çerezi göremediği için yenileme yapamıyor ve soğuk sayfa yüklemesi kullanıcıyı login'e düşürüyor.
- **Önerilen değişiklik:** `refresh_token` çerezi için `path=/`. `httpOnly` + `Secure` + `SameSite=Strict` korunduğu için XSS/CSRF yüzeyi değişmez; `path` bir güvenlik sınırı değil, yalnız gönderim kapsamıdır.
- **Frontend geçici çözümü (Faz 2.2'de):** `/login` üzerinde sessiz oturum geri yükleme (BFF `/api/v1/auth/refresh` path'i çerezle eşleştiği için istemci tarafından çalışır) + sekme açıkken proaktif yenileme (BroadcastChannel kilidi, S-12).
- **Öncelik:** P2 · **Efor:** S · **Faz:** 2 (backend onayı gelene kadar frontend geçici çözümle ilerler)
- **Kabul kriteri:** `Set-Cookie` yanıtında `refresh_token; Path=/; HttpOnly; SameSite=Strict`; süresi dolmuş access token'lı soğuk `/dashboard` isteği login'e düşmeden yenilenip 200 döner.

### B-16 — Ekonomi sembollerinin favorilere eklenebilmesi (Faz 3.3 bulgusu)

- **Bulgu:** `favorites.py::validate_ticker` yalnız BIST ticker'larını kabul ediyor; `POST /favorites/USD` (kanonik FX/metal sembolü) reddediliyor. Bu yüzden `/symbol/[symbol]` sayfasında favori toggle şu an yalnız BIST'te gösteriliyor; FX/metal takibi mümkün değil.
- **Önerilen değişiklik:** `validate_ticker` yerine `SYMBOL_REGISTRY` + BIST doğrulamasını kapsayan ortak bir doğrulayıcı; `favorites.ticker_code` kanonik sembolü saklar.
- **Öncelik:** P2 · **Efor:** S · **Faz:** 3.4
- **Bloke ettiği:** U-12 (tek takip listesi; FX/metal favorileri).
- **Kabul kriteri:** `POST /favorites/USD` 200; `GET /favorites` BIST ve ekonomi sembollerini birlikte döner; geçersiz sembol 400/404.

### B-17 — Anonim piyasa okuması (public-first) + IP bazlı limit

- **Amaç:** Ürün kararı: piyasa verisi çoğunlukla public (TradingView gibi); yalnız kişisel varlıklar/aksiyonlar login ister. Bugün `/api/*` auth middleware'i anonim isteği 401'le reddediyor (ISSUES.md A7).
- **Önerilen değişiklik:** Şu **okuma** uçlarını anonim erişime aç (mevcut şemalar korunur):
  `GET /companies/summary`, `/companies/info/{ticker}`, `/companies/search`, `/price/current`, `/price/history/{ticker}`, `/economy/quotes`, `/economy/history/{symbol}`, `/ipo/{upcoming,draft,active,slug}`, `/news/{ticker}`, `/digest`.
  Anonim erişimde **IP başına sıkı rate limit** (ör. `/price/*` ve `/companies/summary` 60/dk, `/news` 10/dk) + `429` + `Retry-After`; cache başlıkları. Kişisel uçlar (`/favorites`, `/portfolios*`, `/reports*`, `/simulations*`, `/credits`, `/profile`, `/bots`, `/data/*`, `/announcements` yazma) AUTH'lu kalır.
- **Alternatif:** Ayrı `/public/*` uçları — şema tekrarı yüzünden önerilmez.
- **Öncelik:** P1 · **Efor:** M · **Faz:** 5C
- **Bloke ettiği:** X-01…X-09 (public piyasalar, SEO sembol sayfaları).
- **Kabul kriteri:** Anonim `GET /api/v1/companies/summary` ve `/economy/quotes` 200; kişisel uçlar anonime 401; limit aşımı 429 + `Retry-After`; mevcut testler bozulmaz.

### B-03 — Server-side oturum doğrulaması için `JWT_SECRET` paylaşımı

- **Amaç:** Next middleware, korumalı sayfayı render etmeden önce access token'ı **yerel**
  doğrulasın; her sayfa isteğinde backend'e `/profile` gitmesin.
- **Önerilen imza:** Yeni uç yok. Staging/prod'da backend'in kullandığı HS256 `JWT_SECRET`
  BFF runtime'ına env olarak verilir; payload sözleşmesi `{ user_id, iat, exp }` olarak
  donar (HS256, 1 saat). Alternatif: BFF `/profile` çağırır (kabul, ama her istekte +1 tur).
- **Öncelik:** P1 · **Efor:** S · **Faz:** 0
- **Bloke ettiği:** M-03 (middleware), M-02 (BFF proxy), S-12.
- **Kabul kriteri:** Karar yazılı; secret değeri paylaşıldı (kanal: güvenli anahtar deposu);
  süresi geçmiş/yanlış imzalı token BFF'te 401 ile reddediliyor; revocation (parola/donma)
  kontrolünün en kötü 60 sn gecikmeyle backend'de kaldığı dokümante.

### B-05 — Kredi defteri (credit ledger)

- **Amaç:** `user_credits` yalnız toplam tutuyor; harcama/iadelerin dökümü yok.
  Cüzdan UI'ı (U-03) ve aktivasyon telemetrisi (S-10) buna bağlı.
- **Önerilen imza:**
  - Tablo: `credit_ledger(id, user_id, credit_type, delta, reason, ref_type, ref_id, balance_after, created_at)`;
    yazımlar: `spend`, `refund`, `daily_refill`, `register_bonus` (mevcut kredi yollarına bağlanır).
  - `GET /credits/history?limit=20&offset=0&reason=` →
    `{ items: [{ id, delta, reason, credit_type, ref_type, ref_id, balance_after, created_at }],
       total, limit, offset }`
- **Öncelik:** P1 · **Efor:** M · **Faz:** 5 (imza Faz 0'da netleşir)
- **Bloke ettiği:** U-03 (cüzdan geçmişi), S-10 (kayıt→rapor hunisi).
- **Kabul kriteri:** Her kredi hareketi tek satır; `balance_after` toplamla tutarlı; ref_id ile
  rapor/simülasyona geri izlenebilir; sayfalama ve 0 sonuç durumu tanımlı; iade (refund)
  çift kayıt üretmez (idempotent ref).

### B-07 — Hata `detail`'lerinin kodlaştırılması

- **Amaç:** Frontend i18n eşlemesi yapabilsin; bugün ham İngilizce cümleler (`"Market is closed"`,
  `"insufficient credit"`, `"Portfolio not found"`) doğrudan kullanıcıya düşüyor.
- **Önerilen imza:** Yeni uç yok. Tüm 4xx/5xx gövdelerinde `detail` sabit kod:
  `error_market_closed`, `error_insufficient_credit`, `error_portfolio_not_found`,
  `error_report_failed`, `error_simulation_failed`, `error_rate_limited` …
  Auth'taki mevcut `error_email_taken` deseni örnek alınır. Kod listesi `openapi.json`
  açıklamasına yazılır.
- **Öncelik:** P1 · **Efor:** S · **Faz:** 4 (portföy ile birlikte)
- **Bloke ettiği:** U-04, U-05, K-06; `lib/backendErrors.ts` eşleme tablosu.
- **Kabul kriteri:** Portföy/rapor/simülasyon uçlarında serbest metin `detail` kalmadı;
  frontend her kodu tr/en metne çevirebiliyor; bilinmeyen kod için jenerik mesaj var.

### B-09 — Uzun işler için async job altyapısı

- **Amaç:** Rapor üretimi 30-60 sn, simülasyon 600 sn'ye kadar tek HTTP isteğinde senkron
  çalışıyor; yan etkili GET var, iptal yok, proxy timeout riski ve çift harcama mümkün.
- **Önerilen imza:**
  - `POST /reports/generate` → `202 { job_id, status: "queued", credits_spent }`
  - `GET /jobs/{id}` → `{ id, type, status: "queued|running|succeeded|failed|cancelled",
       progress: 0-100, step, result?, error?, created_at, updated_at }`
  - `DELETE /jobs/{id}` → iptal; tamamlanmamışsa kredi iadesi, idempotent
  - Simülasyon: `GET /simulations/{ticker}` → `POST /simulations` (GET geçiş süresince korunur)
- **Öncelik:** P1 · **Efor:** L · **Faz:** 5
- **Bloke ettiği:** U-06 (aşamalı ilerleme + iptal), S-11 (429/offline UX), Faz 5A kabulü.
- **Kabul kriteri:** Uzun işler `202` döner; ilerleme sorgulanabilir; iptal kredi iadesiyle
  sonuçlanır ve ikinci iptal hata üretmez; aynı istek için çift harcama engellenir
  (istemci `Idempotency-Key` başlığı desteklenir).

### B-10 — Portföy özetleri

- **Amaç:** `list_portfolios` tüm işlem gövdelerini döndürüyor ve değerleme içermiyor; liste
  sayfası portföy başına valuation çağırıyor (N+1).
- **Önerilen imza:** `GET /portfolios/summaries` →
  `{ items: [{ id, name, currency, created_at, current_value, cost_basis,
     daily_change_pct, total_return_pct, position_count, as_of }] }`
- **Öncelik:** P1 · **Efor:** M · **Faz:** 4
- **Bloke ettiği:** U-05 (liste kartları), P-05 (dashboard tek paket), P-03.
- **Kabul kriteri:** Tek istek; portföy başına ek valuation çağrısı yok; boş portföy
  `current_value = cost_basis` ve `position_count = 0` ile tutarlı; `as_of` alanı dönüyor.

### B-06 — Birleşik quote bundle

- **Amaç:** `/price/current` tekil, `/economy/quotes` yalnız FX/metal, BIST için ayrı şema;
  watchlist ve ⌘K tek istekte karışık sembol seti ister.
- **Önerilen imza:** `GET /quotes?tickers=THYAO,USDTRY,GRAM_ALTIN` →
  `{ items: [{ symbol, name, type: "bist|fx|metal", price, change, change_pct, currency,
     as_of, stale? }], as_of }` (şema `economy/quotes` temel alınır). Bilinmeyen sembol
  istek hatası değil, `items` dışında `unknown: [...]` listesi döner.
- **Öncelik:** P2 · **Efor:** S-M · **Faz:** 3
- **Bloke ettiği:** P-02, watchlist/favori toplu fiyat, U-10 (⌘K önizleme).
- **Kabul kriteri:** Tek istekte karışık tür; `change_pct` işaretli ve yuvarlanmış; kısmi
  başarı (bazı semboller yok) 200 ile dönüyor; limit üstü istek 400/429 ile net reddediliyor.

### B-11 — Piyasa nabzı (market overview)

- **Amaç:** Dashboard için endeks + kur + altın + yükselen/düşen + hacim liderleri tek
  kaynakta yok; SSR prefetch'e uygun özet gerekiyor.
- **Önerilen imza:** `GET /market/overview` →
  `{ indices: [...], fx: [...], metals: [...], gainers: [...], losers: [...],
     volume_leaders: [...], market_status?, as_of }` (her kalem `B-06` şemasıyla uyumlu).
- **Öncelik:** P2 · **Efor:** M · **Faz:** 5B
- **Bloke ettiği:** U-07, P-05 (dashboard ≤ 3 istek hedefi).
- **Kabul kriteri:** Tek çağrı; tüm liste uzunlukları sabit ve dokümante; `as_of` alanı var;
  cache TTL'i (ör. 60 sn) belirtilmiş.

### B-12 — Toplu sparkline serisi

- **Amaç:** Watchlist/markets mini grafikleri aksi halde ticker başına history isteği üretir.
- **Önerilen imza:** `GET /price/sparklines?tickers=A,B,C&period=1d&points=30` →
  `{ items: [{ symbol, points: [{ t, c }] }], as_of }` (nokta sayısı ≤ 30'a downsample).
- **Öncelik:** P2 · **Efor:** M · **Faz:** 3
- **Bloke ettiği:** Watchlist görsel zenginliği, markets mini grafikleri, U-10.
- **Kabul kriteri:** Ticker başına ayrı istek yok; p95 yanıt < 500 ms (10 sembol); eksik
  sembol sessizce atlanır; `points` boş olabilir ve frontend bunu çizer.

### B-13 — Birleşik arama

- **Amaç:** `/companies/search` yalnız BIST; ⌘K tek aramada BIST + FX/metal + IPO istiyor.
- **Önerilen imza:** `GET /search?q=thya&limit=10` →
  `{ items: [{ type: "bist|fx|metal|ipo", symbol, name, subtitle? }], query }`
- **Öncelik:** P2 · **Efor:** S-M · **Faz:** 5B
- **Bloke ettiği:** U-10 (komut paleti).
- **Kabul kriteri:** p95 < 200 ms; boş/çok kısa sorgu 400 değil boş liste; sonuçlar
  cache'lenebilir (`Cache-Control`); aynı sembol iki türde dönerse `type` ayrımı korunur.

### B-14 — Liste uçlarında tutarlı limit/rate-limit politikası

- **Amaç:** `/price/current` ve `/companies/summary` limitsiz; batch uçlar gelince baskı
  artacak. Uç başına sözleşme net değil.
- **Önerilen imza:** Yeni uç yok. Batch/liste uçlarında `limit` üst sınırı (ör. 50) ve
  aşımda net 400; rate limit aşımında `429` + `Retry-After` başlığı (news'teki desen).
  Sınırlar `openapi.json` açıklamasına yazılır.
- **Öncelik:** P3 · **Efor:** S · **Faz:** 3
- **Bloke ettiği:** S-11 (429/offline UX), S-28 (yük testi senaryosu).
- **Kabul kriteri:** Sınırlar uç bazında dokümante; `429` gövdesi `error_rate_limited`
  koduyla döner; `Retry-After` saniye cinsinden; frontend'in geri çekilme stratejisi test edildi.

### B-15 — Tema/dil tercihinin çapraz cihaz senkronu (opsiyonel)

- **Amaç:** `user_preferences` JSONB zaten var; girişte tema/dil tercihinin cihazlar arası
  taşınması. SSR tema çerezle çözüldüğü için zorunlu değil.
- **Önerilen imza:** Mevcut `GET/PUT /user/preferences` içinde `theme`
  (`dark|light|sepia`) ve `locale` (`tr|en`) alanları sözleşmeye eklenir; yeni uç yok.
- **Öncelik:** P3 · **Efor:** S · **Faz:** 5B
- **Bloke ettiği:** U-11 (topbar tema/dil menüsü) — yalnız senkron ayağı.
- **Kabul kriteri:** Giriş yanıtı prefs'i içeriyor; frontend çerez yoksa prefs ile seed
  ediyor; bilinmeyen değer sessizce yok sayılıp varsayılana düşüyor.

## 3. Faz 0'da istenen kararlar

Faz 0 kabulü için yalnız **imza/karar** gerekiyor, kod değil: B-03 (secret paylaşımı),
B-05 (ledger şeması), B-09 (job sözleşmesi), B-10 (özet yanıt alanları). Bunlar
`openapi.json`'a yansımadan ilgili frontend fazı başlamaz.

**Kapsam dışı not:** B-04 (OpenAPI'nin CI artifaktı olması ve `api-spec` senkronu) bu iş
emrinde değildir; frontend tarafında `npm run gen:api` yerel üretimi yapar, CI drift kontrolü
B-04 sonrası eklenir. B-08 (digest arşivi) doğrulandı — backend işi yok.
