# Yayın Notları (Faz 6 / cutover)

Bu doküman yayın günü kullanılacak operasyon notlarını toplar. **Sır/anahtar içermez.**
Deploy artefaktı: `florence-app:<tag>` Docker imajı (`vX.Y.Z` tag'i = sürüm = imaj etiketi).

## Hedef sunucu

```bash
ssh -i ~/.ssh/florence_deploy_ed25519 root@37.140.242.25
```

## GitHub sırları (repo ayarları)

| Sır | Zorunlu | Amaç |
|---|---|---|
| `DEPLOY_HOST` | evet | Sunucu adresi/IP |
| `DEPLOY_USER` | evet | SSH kullanıcısı |
| `DEPLOY_SSH_KEY` | evet | SSH özel anahtarı |
| `DEPLOY_PORT` | hayır | SSH portu (varsayılan 22) |
| `DEPLOY_TOKEN` | evet | `tag-from-version` için PAT (tag push + `gh workflow run`) |

`APP_DOCKER_NETWORK` bir sır değildir; `/etc/florence/app.env` içine yazılır.

## Ortam değişkenleri (`/etc/florence/app.env`)

`docker run --env-file` ile hem build (NEXT_PUBLIC_*) hem runtime'da kullanılır.

| Değişken | Amaç | Not |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical/sitemap/robots/OG tabanı | **Derleme anında gömülür**; prod değeri şart |
| `API_BASE_URL` | BFF'nin backend'e gittiği iç adres | Ör. `http://api:7055` (nginx değil, doğrudan servis) |
| `NEXT_PUBLIC_PORTFOLIO_COMMISSION_RATE` | komisyon oranı (varsayılan `0.001`) | **Derleme anında gömülür**; backend ile aynı olmalı |
| `SENTRY_DSN` (opsiyonel) | hata raporlama | yoksa raporlama telemetry'ye düşer |
| `APP_DOCKER_NETWORK` (opsiyonel) | app container'ın katılacağı backend ağı | varsayılan `backend_default` |

> **Kritik:** `NEXT_PUBLIC_*` Next tarafından **build sırasında** JS paketine gömülür.
> Runtime'da `--env-file` ile değiştirmek işe yaramaz; imaj doğru değerlerle derlenmelidir.
> Deploy imajı sunucuda derlediği için değerler bu dosyadan okunur.

## Build ve çalıştırma (Docker standalone)

- `Dockerfile` çok aşamalıdır: `deps → build → runner`; runner yalnız
  `.next/standalone`, `.next/static` ve `public/` taşır, **non-root** (`uid 1001`) çalışır.
- Uygulama `node server.js` ile 3000 portunda dinler; nginx `127.0.0.1:3000`'e proxy'ler.
- `HEALTHCHECK` `/api/health` ucunu kullanır (backendsiz; yalnız uygulama ayakta mı).
- Backend'e `API_BASE_URL=http://api:7055` ile erişilir; app container'ı backend'in
  docker ağına (`APP_DOCKER_NETWORK`) katılmalıdır.

Elle çalıştırma (deploy workflow'unun yaptığı):

```bash
cd /opt/florence-app
git fetch --tags --force origin && git checkout --force vX.Y.Z
set -a; . /etc/florence/app.env; set +a
docker build \
  --build-arg "NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL" \
  --build-arg "NEXT_PUBLIC_PORTFOLIO_COMMISSION_RATE=$NEXT_PUBLIC_PORTFOLIO_COMMISSION_RATE" \
  -t florence-app:vX.Y.Z -t florence-app:latest .
docker rm -f florence-app 2>/dev/null || true
docker run -d --name florence-app --restart unless-stopped \
  --env-file /etc/florence/app.env \
  --network "${APP_DOCKER_NETWORK:-backend_default}" \
  -p 127.0.0.1:3000:3000 florence-app:vX.Y.Z
curl -fsS http://127.0.0.1:3000/api/health   # {"status":"ok","version":"X.Y.Z"}
```

Yerel duman testi (Docker var ise):

```bash
docker build -t florence-app:test .
docker run --rm -p 127.0.0.1:13000:3000 florence-app:test
curl -fsS http://127.0.0.1:13000/api/health
```

### systemd alternatifi (Docker'sız)

Docker istemniyorsa `output: "standalone"` çıktısı Node 24 ile de çalışır:

```ini
# /etc/systemd/system/florence-app.service
[Unit]
Description=Florence App (Next standalone)
After=network.target

[Service]
WorkingDirectory=/opt/florence-app/.next/standalone
EnvironmentFile=/etc/florence/app.env
Environment=NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node server.js
Restart=unless-stopped
User=florence
Group=florence

[Install]
WantedBy=multi-user.target
```

`public/` ve `.next/static` standalone ağacına kopyalanmalıdır
(`cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/`).

## nginx

Örnek vhost: [`nginx-florence.conf`](nginx-florence.conf). `/` ve `/api/`
`127.0.0.1:3000`'e gider; statik dosya nginx'ten sunulmaz. TLS sonlandırma burada yapılır.

## Güvenlik başlıkları ve CSP (S-05)

- HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` ve
  `X-Frame-Options` Next tarafından (`next.config.ts::headers()`) eklenir; nginx bunları
  **ezmemeli/silmemeli**.
- CSP (`Content-Security-Policy`) istek başına `src/proxy.ts`'te nonce'la üretilir ve yanıt
  başlığına yazılır. Nonce yalnız **dinamik render** edilen sayfalarda script'lere uygulanır;
  kök layout `cookies()` okuduğu için tüm sayfalar dinamiktir. nginx başka bir CSP
  yazmamalıdır (aksi halde nonce'suz politika script'leri engeller).
- `Strict-Transport-Security` yalnız HTTPS'te etkilidir; TLS sonlandırma nginx/proxy
  katmanında yapılmalıdır.
- `/api/*` proxy matcher'ı tarafından atlanır (CSP nonce üretilmez); `/api/health` bu
  yüzden hem hızlıdır hem de sağlık kontrolüne uygundur.

## nginx / BFF kararı (kritik)

- `/api/` **Next'e** proxy'lenmeli (backend'e değil). Neden: `refresh_token` çerezi
  `path=/api/v1/auth` ile yazılıyor ve BFF (`app/api/v1/[...path]`) tarayıcının gördüğü
  origin'de olmalı. Next içeride `API_BASE_URL`'e proxy'ler.
- Anonim IP rate limit'i için nginx `X-Forwarded-For`'u **ezmeli**:
  `proxy_set_header X-Forwarded-For $remote_addr;`
  Aksi halde (`$proxy_add_x_forwarded_for`) istemci sahte IP ile limit atlatır;
  bu durumda backend'de `TRUST_PROXY_HEADERS=0` kullanılır (tüm anonim trafik proxy IP'sinde toplanır).

## Backend sırası

Faz 5C/4'te biriken backend işleri frontend ile birlikte yayınlanmalı:

| İş | İçerik | Neden |
|---|---|---|
| B-02 | `refresh_token` çerezi `path=/` | SSR/BFF yenilemesi |
| B-03 | `JWT_SECRET` paylaşımı | proxy'de yerel doğrulama (opsiyonel hızlandırma) |
| B-07 | hata `detail`'leri `error_*` | yeni UI i18n eşlemesi |
| B-17 | anonim piyasa okuma + IP limiti | public-first |

**Sıra:** backend önce (ek/uyumlu), sonra frontend cutover. B-07 kısa süre eski web'de ham kod
gösterebilir; kesintisizlik için ikisi yakın zamanda yayınlanmalı.

## Cutover sırası (net)

1. **DB yedeği** al (yayın öncesi zorunlu): `pg_dump` çıktısını sunucu dışına kopyala.
2. **Backend tag** → deploy; `GET /api/v1/version` ile doğrula (B-02/B-07/B-17 dahil).
3. **App tag** → deploy; workflow sunucuda imajı derler, container'ı başlatır ve
   `/api/health` 200 dönene kadar bekler (başarısızsa otomatik rollback).
4. **Health** elle doğrula: `curl -fsS http://127.0.0.1:3000/api/health` → `{"status":"ok","version":"X.Y.Z"}`.
5. **nginx vhost**'unu yeni uygulamaya çevir (eski `web/` dist'ini silmeden); `nginx -t && systemctl reload nginx`.
6. **Smoke** (anonim + oturumlu): `/` ve `/markets` anonim 200; giriş; favori;
   portföy/al-sat; rapor; digest; `/downloads`; `/manifest.webmanifest`; `/sw.js`.
7. **Rollback** (gerekirse): aşağıya bak.

## Rollback

Deploy workflow, yeni container'ı başlatmadan önce çalışan imajı `florence-app:previous`
olarak etiketler. Sağlık kontrolü başarısız olursa otomatik olarak önceki imaja döner.
Elle geri dönüş (tek komut):

```bash
cd /opt/florence-app
docker rm -f florence-app
docker run -d --name florence-app --restart unless-stopped \
  --env-file /etc/florence/app.env \
  --network "${APP_DOCKER_NETWORK:-backend_default}" \
  -p 127.0.0.1:3000:3000 florence-app:previous
curl -fsS http://127.0.0.1:3000/api/health
```

nginx tarafı için: vhost'u eski `web/` dist'ine geri çevir (yeni uygulama dosyaları
silinmez). Backend ek/uyumlu olduğu için geri alınması gerekmez (B-07/B-02 geriye uyumlu).

Artefakt saklama (S-29): `florence-app:<tag>` ve `florence-app:previous` imajları tutulur;
eski tag'ler için periyodik `docker image prune` planlanabilir.

## Bilinen riskler / yapılacaklar

- `NEXT_PUBLIC_SITE_URL` derleme anında gömülür; `/etc/florence/app.env` içinde yoksa
  SEO yanlış URL üretir.
- `public/downloads/` yeni deploy'da boş gelir; masaüstü binary'leri ve `manifest.json`
  `/opt/florence-app/public/downloads/` altına konmalı veya container'a
  `-v /opt/florence-app/downloads:/app/public/downloads:ro` ile mount edilmelidir.
  Aksi halde `/downloads` "sürüm yok" gösterir (masaüstü dondurulmuş; düşük öncelik).
- Anonim rate limit değerleri (60/10 dk) üniversite/NAT paylaşımlı IP'lerde agresif olabilir.
- Sentry DSN verilmezse hata raporlama yalnız telemetry olayı olarak kalır.
- Sunucuda derleme yapıldığı için imaj, CI'da test edilen byte'ların birebir aynısı
  değildir; bu yüzden otomatik rollback güvenlik ağı zorunludur.
- İlk deploy'da `florence-app:previous` yoktur; rollback ancak ikinci deploy'dan sonra
  tek komutla mümkündür.
