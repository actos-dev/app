# 0004 — Grafik kütüphanesi: lightweight-charts

**Durum:** Kabul edildi · **Tarih:** 2026-09-21

## Bağlam

Mevcut `StockChart.tsx` `klinecharts` kullanır ve kütüphane Node'da import anında
`ReferenceError` verir; bu yüzden grafik sayfası SSR edilemez ve client-only hack'lere
bağlıdır. Hedef görsel dil TradingView'dır (yoğun, grafik merkezli, koyu varsayılan).
Plan M-05/D-06 grafik yüzeyinin SSR uyumlu ve dispose edilebilir olmasını şart koşar.

## Karar

Tüm grafikler **lightweight-charts** (TradingView OSS) ile çizilir. Grafik bileşenleri
`next/dynamic` + `ssr:false` client adasıdır ve SSR'da iskelet gösterilir. Kütüphane
seçimi `ChartPanel` primitifi arkasında kapsüllenir; iş bileşenleri doğrudan import etmez
(böylece ileride değişim tek dosyada kalır). `klinecharts` bağımlılığı taşınmaz.

## Sonuçlar

- Grafik kodu sunucuya girmez; SSR crash'i biter. İlk yükte grafik chunk'ı ayrı kalır.
- Bileşen unmount'ta `chart.remove()` çağrısı zorunludur (P-12); yoksa bellek sızıntısı.
- Token'lardan türeyen grafik renkleri tek yerden yönetilir (D-02 ile uyumlu).

## Alternatifler

- **klinecharts + `ssr:false`:** En hızlı geçiş, ama TradingView hissi ve uzun vadeli bakım
  riski; kütüphane SSR hatası vermeye devam eder.
- **Recharts / ECharts:** Finansal mum grafiği ve performans hedefi için uygun değil;
  ECharts büyük bundle, Recharts gerçek-zamanlı çizimde zayıf.
