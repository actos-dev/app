# Mimari Karar Kayıtları (ADR)

Florence App'te geri dönüşü maliyetli kararlar burada tutulur. Amaç, "neden böyle yaptık"
sorusunu koda ve commit geçmişine bakmadan yanıtlamaktır. Plan maddeleri
(`../WEB_REFACTOR_PLAN.md`) ne yapılacağını, ADR'ler ise **neden** öyle yapıldığını anlatır.

## Kurallar

- Dosya adı: `NNNN-kisa-baslik.md` (NNNN sıfır dolgulu, 4 hane).
- Durum satırı zorunlu: `Kabul edildi` / `Önerildi` / `Yerini aldı: NNNN`.
- Başlıklar sabit: **Bağlam → Karar → Sonuçlar → Alternatifler**.
- Uzunluk 10-20 satır; ölçüm, dosya yolu ve madde ID'si referansı verilir.
- Karar değişirse eski ADR silinmez; yeni ADR yazılır ve eskisi `Yerini aldı` olarak işaretlenir.
- Yeni ADR, ilgili PR ile aynı anda eklenir.

## Dizin

| No | Karar | Durum |
|---|---|---|
| [0001](0001-nextjs-app-router.md) | Next.js App Router + RSC/SSR hibrit | Kabul edildi |
| [0002](0002-tema-stratejisi.md) | 3 tema (koyu/açık/sepya) + zorunlu kontrast | Kabul edildi |
| [0003](0003-lint-ve-token-kapisi.md) | ESLint + tasarım token kapısı (oxlint terk) | Kabul edildi |
| [0004](0004-grafik-kutuphanesi.md) | Grafiklerde lightweight-charts | Kabul edildi |
| [0005](0005-openapi-codegen.md) | `generated.ts` tek tip kaynağı, elle tip yasak | Kabul edildi |
| [0006](0006-i18n-ve-tema-runtime.md) | i18n + tema çerezden SSR; URL'de dil öneki yok | Kabul edildi |
| [0007](0007-bff-ve-oturum-katmani.md) | BFF proxy + sunucu oturum katmanı (B-03 fallback) | Kabul edildi |
| [0008](0008-guvenlik-basliklari-ve-csp.md) | Güvenlik başlıkları + CSP nonce | Kabul edildi |
