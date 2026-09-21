# 0003 — Lint ve tasarım token kapısı (oxlint terk)

**Durum:** Kabul edildi · **Tarih:** 2026-09-21

## Bağlam

Eski `web/` reposunda lint `oxlint`'tir; ESLint/Prettier yoktur ve `tsc -b` tek gerçek kapıdır.
Plan K-08, hardcoded string / keyfi renk / import sınırı gibi kurallar ister. Ayrıca rapor
içeriği gibi AI üretimi HTML yüzeyleri için sanitizasyon kararı (S-03) Faz 5'e bırakılmıştır;
o zamana kadar `dangerouslySetInnerHTML` kullanılmamalıdır. Tasarım tarafında 12px altı 43
keyfi font, keyfi hex renkler ve `!` prefix'li utility'ler token disiplinini delmektedir.

## Karar

- **ESLint 9 (flat config)** tek lint aracıdır: `eslint-config-next` (core-web-vitals +
  typescript) temel alınır; `react-hooks` kuralları açık kalır. `npm run lint` = `eslint .`.
- `no-restricted-syntax` ile `dangerouslySetInnerHTML` **error** (hem JSX attribute hem
  property nesnesi). Gevşetme ancak S-03 sanitizasyon kararıyla yapılır.
- **`scripts/check-design-tokens.mjs`** (`npm run check:tokens`) `src/**` içinde üç ihlali
  exit 1 ile engeller: 12px altı keyfi font (`text-[10px]`), keyfi renk utility'si
  (`bg-[#…]`) ve `!` prefix (`!text-sm`). TS/TSX'te yalnız string literal taranır.
- Muafiyet: `src/types/generated.ts` (üretilmiş dosya).

## Sonuçlar

- Kurallar gevşetilmeden ihlal edilemez; token'lar Faz 1'de tanımlandığında kapı hazırdır.
- `check:tokens` yanlış pozitif üretmemek için sınıf string'i bağlamına dikkat eder; yeni
  kural eklenirse bu bağlam korunmalıdır.
- Hardcoded string kuralı (K-08) i18n altyapısıyla birlikte Faz 1'de genişletilir.

## Alternatifler

- **oxlint'i korumak:** Hızlıdır ama bu üç kural için eklenti/yazım gerektirir; Next 16'nın
  resmi config'i ESLint tabanlıdır, ikisini paralel yaşatmak bakım yüküdür.
- **Kuralları uyarıya çevirmek:** "Testi geçirmek için kural gevşetme" yasağına aykırı;
  ihlal sayısı ölçülemez hale gelir.
