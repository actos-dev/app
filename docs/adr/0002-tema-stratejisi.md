# 0002 — Tema stratejisi: 3 tema + kontrast zorunluluğu

**Durum:** Kabul edildi · **Tarih:** 2026-09-21

## Bağlam

Mevcut uygulamada 12 tema × açık/koyu = 22 CSS dosyası vardı ve `index.css`'teki 68 renk
çifti WCAG AA'yı geçmiyordu (47'si hiç kullanılmayan `--chart-*`). Alfa ile soluklaştırma
(`text-muted/60`) kontrastı ölçülemez kılıyor; beyaz metin/amber CTA 2,15:1 ölçüldü. Tema
seçimi istemci store'unda tutulduğu için ilk boyamada FOUC ve hydration uyuşmazlığı vardı.

## Karar

**Üç tema** kalır: Koyu (varsayılan), Açık, Sepya. Tek token seti, semantik roller
(`bg`, `surface`, `text-muted`, `border`, `primary`, `positive`, `negative`, `focus-ring`…)
üzerinden tanımlanır; `--chart-*` gibi kullanılmayan roller açılmaz. Tema **çerezden
server-side** okunur ve `<html data-theme>` olarak SSG/SSR'da yazılır. Kurallar:

- Gövde metni ≥ 4,5:1; büyük metin/ikon/kenar ≥ 3:1; `*-fg` çiftleri her temada AA.
- Soluk metin **opak** token'dır; alfa ile soluklaştırma yasaktır.
- Kontrast testi 3 tema × token çiftleri için CI'da zorunludur (plan §8/§9).

## Sonuçlar

- FOUC ve hydration uyuşmazlığı sıfır; tema değişimi yalnız çerez + attribute yazar.
- Yeni renk eklemek test çiftini de güncellemeyi gerektirir; "hızlı renk" kaçışı yok.
- 19 tema ve ambient animasyonlar emekli edilir (D-01, D-08).

## Alternatifler

- **`next-themes`:** Çerez tabanlı server çözümüyle çakışır, FOUC riskini istemciye taşır.
- **Tema sayısını korumak:** 68 kontrast hatasının ve 33 KB CSS'in sahibi; bakım yükü kanıtlı.
