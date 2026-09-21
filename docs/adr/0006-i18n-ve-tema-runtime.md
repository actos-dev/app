# 0006 — i18n ve tema runtime: çerezden SSR, URL'de dil öneki yok

**Durum:** Kabul edildi · **Tarih:** 2026-09-21

## Bağlam

Eski uygulamada tema Zustand store'unda tutulduğu için ilk boyamada FOUC ve hydration
uyuşmazlığı vardı (`themeStore.ts:8,15`); i18n'de iki dil de eager yükleniyor, dil URL'e
yansımıyordu (`i18n/index.ts:5-16`). Plan M-08/M-09 ve ADR 0002 tema için sunucu taraflı
çözümü zaten şart koşuyor. Dil için URL öneki (`/en/...`) istenmiyor: rota yapısı tek kalacak.

## Karar

- **i18n:** `next-intl` (4.14.6), routing'siz App Router kurulumu. Dil kaynağı sırası:
  `NEXT_LOCALE` çerezi → `Accept-Language` başlığı → varsayılan `tr`; geçersiz değer `tr`.
  Desteklenen diller `tr`, `en`.
- **Tema:** `theme` çerezi (`dark|light|sepia`), varsayılan `dark`; geçersiz değer `dark`.
  Kök layout çerezi okur ve `<html data-theme>` olarak yazar; `generateViewport`
  `themeColor`'ı `themeColors` haritasından seçer.
- Çözümleyiciler `src/i18n/config.ts` içinde **saf** fonksiyonlardır (test edilebilir, yan
  etkisiz); çerez yazımı `"use server"` action'larında (`src/i18n/actions.ts`) yapılır.
- Mesajlar `src/i18n/request.ts` içinde tembel `import()` ile yüklenir (P-09);
  anahtar setleri `i18n-keys.test.ts` ile eşitlenir (S-18).

## Sonuçlar

- FOUC ve hydration uyuşmazlığı yok; tema/dil yalnızca çerez + sunucu render'ı.
- Çerez okunduğu için **kök layout ve tüm ağaç dinamik render edilir**; statikleştirme
  kaybı kabul edildi. İleride public sayfalarda (S-19, Faz 7) tercihler `Suspense` sınırına
  alınarak veya çerez bağımlılığı sayfa altına itilerek statik gövde korunabilir.
- Dil değişimi tam sayfa yenilenmez; server action + `revalidatePath("/", "layout")`
  RSC ağacını günceller. URL'de `?lang=`/önek yok; bağlantı paylaşımı tek biçimli kalır.
- Yeni dil/tema eklemek `config.ts` + `messages/<dil>.json` + kontrast testi gerektirir.

## Alternatifler

- **URL'de dil öneki (`/[locale]/...`):** SEO'da güçlü ama tüm rotaları çoğaltır; dil
  tercihi kullanıcı ayarı olduğundan gerekmedi.
- **`next-themes` / istemci store'u:** FOUC riskini istemciye taşır (ADR 0002 ile çelişir).
- **`lang` için ayrı çerez yerine doğrudan `Accept-Language`:** Kullanıcının elle seçimi
  kalıcı olmaz; çerez birincil kaynak bırakıldı.
- **Mesajları sunucuda eager yüklemek:** P-09 ihlali; iki dil de bundle'a girerdi.
