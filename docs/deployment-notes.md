# Yayın Notları (Faz 6 / cutover)

Bu doküman yayın günü kullanılacak operasyon notlarını toplar. **Sır/anahtar içermez.**

## Hedef sunucu

```bash
ssh -i ~/.ssh/florence_deploy_ed25519 root@37.140.242.25
```

## Ortam değişkenleri (uygulama)

| Değişken | Amaç | Not |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical/sitemap/robots/OG tabanı | **Prod'da mutlaka set edilir**; yoksa `localhost:3000` |
| `API_BASE_URL` | BFF'nin backend'e gittiği iç adres | Ör. `http://api:7055` (nginx değil, doğrudan servis) |
| `NEXT_PUBLIC_PORTFOLIO_COMMISSION_RATE` | komisyon oranı (varsayılan `0.001`) | backend ile aynı olmalı |
| `SENTRY_DSN` (opsiyonel) | hata raporlama | yoksa raporlama telemetry'ye düşer |

## Build ve çalıştırma

- `npm ci && npm run build` (Next standalone hedefiyle Docker imajı).
- Uygulama `next start` (Node) ile 3000 portunda; nginx `/`'i buraya proxy'ler.

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

## Cutover ve rollback

1. DB yedeği al (yayın öncesi zorunlu).
2. Backend'i güncelle (tag → deploy), `/api/v1/version` ile doğrula.
3. Yeni frontend imajını çalıştır, sağlık kontrolü (`/`, `/markets` anonim 200).
4. nginx vhost'unu yeni uygulamaya çevir (eski `web/` dist'ini silmeden).
5. Smoke: anonim piyasa, giriş, favori, portföy/al-sat, rapor, digest.
6. **Rollback:** nginx'i eski dist'e geri çevir; backend ek/uyumlu olduğu için geri alınması
   gerekmez (B-07/B-02 hariç, onlar da geriye uyumlu).

## Bilinen riskler / yapılacaklar

- `NEXT_PUBLIC_SITE_URL` set edilmezse SEO yanlış URL üretir.
- `/downloads/manifest.json` yeni deploy'da `public/` altına düşmezse indirilenler sayfası
  boş görünür (masaüstü dondurulmuş durumda; düşük öncelik).
- Anonim rate limit değerleri (60/10 dk) üniversite/NAT paylaşımlı IP'lerde agresif olabilir.
- Sentry DSN verilmezse hata raporlama yalnız telemetry olayı olarak kalır.
