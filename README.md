# Florence App

Florence'ın yeni web uygulaması: BIST (Borsa İstanbul) odaklı piyasa takibi ve **sanal portföy**
platformunun Next.js istemcisi. Gerçek para/emir yoktur; portföyler kâğıt üstünde, canlı fiyat ve
komisyon hesabıyla simüle edilir.

Bu repo, `web/` (Vite SPA) uygulamasının yerini alacak sıfırdan yazımdır. Referans sözleşme:
[`../WEB_REFACTOR_PLAN.md`](../WEB_REFACTOR_PLAN.md).

- **Durum:** Faz 0 — karar ve hazırlık. Uygulama sayfaları henüz yok; CI, tip üretimi ve kalite
  kapıları kurulu.
- **Yığın:** Next.js 16 (App Router, `src/` dizini, Turbopack) · React 19 · TypeScript strict ·
  Tailwind CSS v4 (`@tailwindcss/postcss`) · Vitest + Testing Library.
- **`web/` donduruldu:** Eski SPA yalnız referans olarak durur; bu repodan ona dokunulmaz.
  `desktop/` ve Tauri yolu bu uygulamanın kapsamında değildir.
- **`backend/` ayrı repo:** bu repodan değiştirilmez; API sözleşmesi OpenAPI'dan tüketilir.

## Komutlar

```bash
npm ci                     # kilit dosyasından kurulum (CI ile aynı)
npm run dev                # geliştirme sunucusu (localhost:3000)
npm run gen:api            # backend'den openapi.json + src/types/generated.ts üret
npm run typecheck          # next typegen + tsc --noEmit (temiz klonda route tipleri için şart)
npm run lint               # eslint .
npm run check:tokens       # keyfi renk/font ve ! prefix kapısı
npm test                   # vitest run (tek seferlik)
npm run test:watch         # vitest (izleme modu)
npm run check              # typecheck + lint + tokens + test (PR öncesi tam kapı)
npm run build              # üretim derlemesi
bash scripts/generate-icons.sh  # PWA ikonlarını icon.svg'ten üret (rsvg-convert + magick)
```

### PWA ikonları

`public/pwa-192.png`, `public/pwa-512.png`, `public/pwa-maskable-512.png` ve
`src/app/apple-icon.png` elle commit edilir; kaynak tek dosyadır (`src/app/icon.svg`) ve
`scripts/generate-icons.sh` ile yeniden üretilir. İkon değişince betiği çalıştırıp çıktıları
birlikte güncelleyin.

### `gen:api` nasıl çalışır?

1. `OPENAPI_URL` tanımlıysa şema oradan indirilir.
2. Tanımlı değilse `../backend/.venv/bin/python` ile `app.openapi()` çağrılır (cwd: `../backend`).
3. Şema `openapi.json` olarak yazılır, ardından `src/types/generated.ts` üretilir.

Her iki çıktı da **commit edilir**. API tipleri elle yazılmaz; tüm tipler `generated.ts`'ten
türetilir (bkz. `docs/adr/0005-openapi-codegen.md`).

## Kalite kapıları

`npm run check` şunları sırayla koşar ve hepsi yeşil olmadan PR merge edilmez:

| Kapı | Ne yapar |
|---|---|
| `next typegen && tsc --noEmit` | strict tip kontrolü (route tipleri dahil) |
| `eslint .` | Next + react-hooks kuralları; `dangerouslySetInnerHTML` yasak |
| `check:tokens` | 12px altı keyfi font, keyfi renk utility'si, `!` prefix ihlali |
| `vitest run` | birim testleri |
| `next build` | üretim derlemesi (CI'da ayrıca koşar) |

CI (`.github/workflows/ci.yml`) her push ve PR'da Node 24 ile bu adımları çalıştırır.

## Sürüm, tag ve deploy

- Sürüm `package.json` içindeki `version` alanıdır; Conventional Commits kullanılır
  (`feat(scope):`, `fix:`, `chore: bump version to X.Y.Z`).
- **Tag = deploy tetikleyicisi.** `main`'e push sonrası sürümden `vX.Y.Z` tag'i atılır ve deploy
  akışı başlar. Bu repoda deploy'dan **önce CI'daki tüm testler koşar** (eski `web/` reposunda
  CI'da test adımı yoktu).
- Kırıcı değişiklik serbesttir; eski URL'ler için yönlendirme dışında geriye uyumluluk
  hedeflenmez.

## Dokümanlar

- [`docs/adr/`](docs/adr/README.md) — mimari karar kayıtları.
- [`docs/backend-requests.md`](docs/backend-requests.md) — backend'den beklenen işler (Faz 0
  sözleşmeleri).
- [`AGENTS.md`](AGENTS.md) — repo çalışma kuralları (ajanlar ve geliştiriciler için).
- [`../WEB_REFACTOR_PLAN.md`](../WEB_REFACTOR_PLAN.md) — tüm refactor maddeleri, faz planı,
  kabul kriterleri.
