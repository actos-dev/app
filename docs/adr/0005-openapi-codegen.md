# 0005 — OpenAPI codegen: `generated.ts` tek tip kaynağı

**Durum:** Kabul edildi · **Tarih:** 2026-09-21

## Bağlam

Eski uygulamada 107 `as X` cast, 58 `res.data as` ve 577 satır elle yazılmış `types/api.ts`
vardı; `openapi.json` CI'da üretilmediği için `api-spec/openapi.json` bayatladı ve backend'de
var olan `digest` router'ı spec'te görünmedi. Drift'in kökü, tiplerin insan eliyle ve
gerçek şemadan bağımsız yaşamasıdır. Plan K-05, cast sayısını < 10'a indirmeyi hedefler.

## Karar

- Tek komut: **`npm run gen:api`** (`scripts/gen-api.mjs`). `OPENAPI_URL` varsa oradan
  fetch eder; yoksa `../backend/.venv/bin/python` ile `app.openapi()` çıktısını döker,
  stdout'u `JSON.parse` ile doğrular, stderr'i loglar.
- Çıktılar: repo kökünde **`openapi.json`** ve **`src/types/generated.ts`** (openapi-typescript
  Node API'si). İkisi de **commit edilir**; `.gitignore`'a alınmaz.
- Tipler `generated.ts`'ten türetilir; elle API tipi yazmak yasaktır. Yeni alan gerekirse
  önce backend şeması güncellenir, sonra `gen:api` koşulur.

## Sonuçlar

- Backend ile istemci arasındaki sözleşme tek kaynaktan gelir; `as` cast'lerin çoğu gereksizleşir.
- CI'da drift kontrolü (B-04) bu komutun çıktısını `git diff --exit-code` ile karşılaştıracak.
- Backend ayakta değilse `OPENAPI_URL` ile üretim şeması kullanılabilir; Python yolu yalnız
  yerel geliştirme kolaylığıdır.

## Alternatifler

- **CLI'ı `npx` ile çağırmak:** Ekstra süreç, yol/cwd kırılganlığı; Node API'si tipli ve hızlı.
- **Elle `types/api.ts`:** Kanıtlı şekilde drift üretir; 165 cast'in kaynağıdır.
- **Zod codegen:** Runtime doğrulama için değerli ama şimdilik kapsam dışı; tipler için
  openapi-typescript yeterli.
