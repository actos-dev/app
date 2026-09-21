# 0001 — Next.js App Router + RSC/SSR hibrit

**Durum:** Kabul edildi · **Tarih:** 2026-09-21

## Bağlam

Mevcut `web/` uygulaması Vite + React Router SPA'dır ve SSR'a tek noktadan kapalıdır:
`quality.ts:12` modül tepesinde `window`'a dokunur, klinecharts Node'da patlar, 25 dosya
`react-router`'a bağlıdır, kökte `BrowserRouter` ve modül singleton'ları vardır. Sonuç: public
içerik HTML'de yok, `generateMetadata`/OG/sitemap mümkün değil, ilk yük ~216 KB gzip.
Plan §0 ve §2.2, public sayfaların gerçek SSR/SSG'sini, korumalı sayfaların streamed shell +
client veri olmasını şart koşar.

## Karar

Yeni uygulama **Next.js 16 App Router** üzerine sıfırdan yazılır:
public sayfalar (`/`, `/about`, auth) SSR/SSG; korumalı sayfalar server layout'ta
doğrulanıp kabuk stream edilir; grafik/canvas gibi etkileşimli parçalar
`next/dynamic` + `ssr:false` client adalarıdır. Filtre/sıralama durumu URL searchParams'ta,
kalıcı UI tercihleri Zustand'da tutulur. Tauri/masaüstü yolu yeni uygulamaya taşınmaz.

## Sonuçlar

- Landing ve auth içeriği HTML'de; Lighthouse SEO hedefi (Faz 2) mümkün.
- Modül tepesinde `window`/`import.meta.env` yasak; sunucu/istemci sınırı bilinçli çizilir.
- RSC fetch (ilk veri) + TanStack Query (canlı/polling) ikili veri katmanı gelir.
- App Router sözleşmesi gereği `typedRoutes` açılır (Next 16'da stable).

## Alternatifler

- **Remix:** SSR güçlü ama ekip/ekosistem Next'te; Base UI + i18n tarafı daha az kanıtlı.
- **Vite SSR + React Router v7:** Mevcut kod en yakın; ancak asıl maliyet olan SSR blocker
  temizliğini yapmadan kazanç sağlamaz, RSC/metadata avantajı yok.
