<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Florence App — Repo Kuralları

Florence'ın yeni Next.js istemcisi. Referans repo değil, **aktif geliştirme alanı**; sözleşme
[`../WEB_REFACTOR_PLAN.md`](../WEB_REFACTOR_PLAN.md)'dir. Plan maddeleri (`M-xx`, `D-xx`, `U-xx`,
`B-xx`, `S-xx`, `K-xx`) commit mesajlarında ve PR açıklamalarında referans verilir.

## Dil

- **Kod tanımlayıcıları, log mesajları ve API alan adları İngilizce; yorum ve dokümanlar Türkçe.**
  Bu kasıtlı ve tüm Florence repolarında tutarlıdır.
- Kullanıcıya görünen metin asla koda gömülmez (i18n hedefi; hardcoded TR yasak).

## Commit

- **Conventional Commits, İngilizce**: `feat(scope): ...`, `fix: ...`,
  `chore: bump version to X.Y.Z`, `docs: ...`, `test: ...`.
- Sürüm bump'ı `package.json`'daki `version` iledir; **tag = deploy tetikleyicisi**. Bu repoda
  deploy öncesi CI'daki tüm kalite kapıları koşar.
- Commit atma yetkisi kullanıcıya aittir; ajan kendiliğinden commit atmaz.

## Kalite kapıları

- PR öncesi **`npm run check`** (typecheck + lint + check:tokens + test) zorunlu; ayrıca
  `npm run build` yeşil olmalı.
- `eslint.config.mjs` kuralları **gevşetilemez**; kuralı geçmek için kod düzeltilir.
  `dangerouslySetInnerHTML` sanitizasyon kararı (S-03) alınana kadar yasaktır.
- `scripts/check-design-tokens.mjs`: 12px altı keyfi font, keyfi renk utility'si ve `!` prefix
  yasak. Tema token'ları Faz 1'de tanımlanır; keyfi değer yerine token kullanılır.
- Testler Vitest + Testing Library (`src/test/setup.ts`); yeni davranış testle gelir.

## API tipleri

- **Elle API tipi yazmak yasak.** Tek kaynak `src/types/generated.ts`'tir; `npm run gen:api` ile
  üretilir. Alan değişikliği gerekiyorsa önce backend şeması güncellenir, sonra `gen:api` koşulur.
- `openapi.json` ve `src/types/generated.ts` **commit edilir** (gitignore'da değildir).
- `as X` cast'i son çaredir; tip uyuşmazlığı önce şema/üretim tarafında çözülür.

## Sınırlar

- Bu repodan **`../web` ve `../backend` dizinlerine yazılmaz**; backend işleri
  [`docs/backend-requests.md`](docs/backend-requests.md) üzerinden talep edilir.
- `web/` dondurulmuştur (yalnız referans); masaüstü/Tauri kapsam dışıdır.
- Sayfa/route üretimi Faz 1'de başlar; Faz 0 yalnız altyapı, CI ve sözleşmedir.
- Tasarım referansı TradingView + Linear/Vercel; UI metinleri tr/en çift dilli, varsayılan tr.

## Dokümanlar

- Kararlar `docs/adr/NNNN-*.md` (Bağlam/Karar/Sonuçlar/Alternatifler, Türkçe).
- Yeni sayfa/feature eklerken ilgili plan maddesini ve varsa ADR'yi güncelle.
