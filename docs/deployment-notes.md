# Yayın Notları (Faz 6 / cutover)

Operasyon notları; **sır/anahtar içermez.** Artefakt:
`ghcr.io/actos-dev/app:<tag>` (imaj CI'da derlenir, GHCR'a itilir; sunucu yalnız çeker).

## Sunucu ve bağlam

```bash
ssh -i ~/.ssh/florence_deploy_ed25519 root@37.140.242.25
```

- Aynı sunucuda **Actos** projesi de çalışıyor (`actos_web` 3000, `actos_api` 3100,
  `actos_network`). **Dokunulmaz.**
- Florence: `florence_api` (127.0.0.1:7055), `florence_postgres` (5433),
  `florence_redis` (5434), `searxng` (5435), ağ: **`florence_default`**.
- Uygulama bu yüzden **127.0.0.1:3300**'de yayınlanır (3000/3100 dolu).
- Nginx vhost'ları: `florencex.com.tr` (web) ve `api.florencex.com.tr` (backend);
  TLS Certbot, gerçek IP için `cloudflare-realip.conf`.

## Deploy akışı (ghcr)

1. `main`'e push → `ci.yml` (typecheck/lint/token/unit).
2. Sürüm `package.json` `version`'da; **tag elle atılır**: `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. `deploy.yml` tag'de: `npm ci` → `npm run check` → imajı derler →
   `ghcr.io/actos-dev/app:<tag>` ve `:latest` olarak iter → SSH ile sunucuda
   `docker pull` + container'ı yeniden başlatır → `/api/health` 200 bekler →
   başarısızsa önceki imaja **otomatik rollback**.

`NEXT_PUBLIC_*` derleme anında gömülür; bu yüzden deploy workflow'daki
`build-args` tek kaynaktır (`NEXT_PUBLIC_SITE_URL=https://florencex.com.tr`,
`NEXT_PUBLIC_PORTFOLIO_COMMISSION_RATE=0.001`). Env dosyasında değiştirmek işe yaramaz.

## GitHub sırları (`actos-dev/app`)

| Sır | Zorunlu | Amaç |
|---|---|---|
| `DEPLOY_HOST` | evet | `37.140.242.25` |
| `DEPLOY_USER` | evet | `root` |
| `DEPLOY_SSH_KEY` | evet | deploy özel anahtarı |
| `DEPLOY_PORT` | hayır | varsayılan 22 |

## Sunucu ortamı (`/etc/florence/app.env`)

| Değişken | Amaç |
|---|---|
| `API_BASE_URL` | BFF hedefi: `http://florence_api:7055` |
| `NEXT_PUBLIC_SITE_URL` | canonical/sitemap (build-time; runtime'da zararsız) |
| `NEXT_PUBLIC_PORTFOLIO_COMMISSION_RATE` | komisyon oranı (backend ile aynı) |
| `SENTRY_DSN` (ops.) | hata raporlama |

Container `--network florence_default --env-file /etc/florence/app.env -p 127.0.0.1:3300:3000`.

## nginx (florencex.com.tr)

- `/` → `http://127.0.0.1:3300` (Next).
- `/api/` → **`http://127.0.0.1:3300`** (BFF). Backend'e doğrudan gönderilmez;
  `refresh_token` çerezi `path=/api/v1/auth` olduğu için BFF tarayıcının gördüğü origin'de olmalı.
- `/avatars/` → `http://127.0.0.1:7055` (backend StaticFiles) — korunur.
- **XFF:** `proxy_set_header X-Forwarded-For $remote_addr;` (ezme). Aksi halde anonim
  IP rate limit'i sahte IP ile atlatılabilir.
- Nginx **CSP/güvenlik başlığı yazmaz**; Next nonce'lu CSP ve diğer başlıkları kendisi gönderir.
- `/api/` için eski nginx `limit_req` zone'ları kaldırılır (backend kendi limitlerini uygular).

`api.florencex.com.tr` vhost'u değişmez (7055'e proxy).

## Backend sırası

| İş | İçerik |
|---|---|
| B-02 | `refresh_token` çerezi `path=/` |
| B-03 | `JWT_SECRET` paylaşımı (opsiyonel hızlandırma) |
| B-07 | hata `detail`'leri `error_*` |
| B-17 | anonim piyasa okuma + IP limiti |

**Sıra:** backend önce, sonra frontend cutover. B-07 kısa süre eski web'de ham kod
gösterebilir; ikisi yakın zamanda yayınlanmalı.

## Cutover sırası

1. **DB yedeği** (zorunlu):
   `docker exec florence_postgres pg_dump -U postgres -d postgres --no-owner -Fc > /root/florence-db-<ts>.dump`
   → `pg_restore -l ... | grep -c "TABLE DATA"` ile doğrula (beklenen 29).
2. **Backend**: `cd /opt/florence && git pull && docker compose build api admin && docker compose up -d --no-build api admin`;
   `curl 127.0.0.1:7055/api/v1/version`.
3. **App tag** → `deploy.yml` imajı iter, container'ı başlatır, health bekler.
4. **nginx vhost**'unu 3300'e çevir; `nginx -t && systemctl reload nginx`.
5. **Smoke:** anonim `/` `/markets` `/symbol/THYAO` 200; `/api/v1/companies/summary` anon 200;
   giriş→dashboard; favori; portföy/al-sat; rapor; digest; `/manifest.webmanifest`; `/sw.js`.
6. **Rollback:** nginx'i eski dist'e (`/var/www/florencex`) geri çevir; app container'ı
   `docker run ... ghcr.io/actos-dev/app:<önceki-tag>` ile geri al (workflow `florence-app:previous` tutar).

## Bilinen riskler

- **Bellek:** sunucuda ~1 GB boş RAM; bu yüzden imaj **yerelde/CI'da** derlenir, sunucuda derlenmez.
- `NEXT_PUBLIC_SITE_URL` yanlışsa SEO/canonical bozulur (build-arg).
- `/downloads/manifest.json` imaja gömülü gelmezse indirilenler boş görünür (masaüstü donduruldu).
- Anonim rate limit (60/10 dk) NAT paylaşımlı ağlarda agresif olabilir.
- Sentry DSN yoksa hata raporlama yalnız telemetry olayı olarak kalır.
- Nonce CSP **dinamik render** gerektirir; sayfa statikleştirilirse script'ler engellenir.
