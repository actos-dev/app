/**
 * Geçici yer tutucu (birim 1.1): token'ların derlendiğini gösteren sade
 * renk şeridi. Landing sayfası ve i18n birim 1.5/2.x ile gelecek; kullanıcı
 * metni içermez.
 */
const SWATCHES = [
  "bg-background",
  "bg-surface",
  "bg-surface-raised",
  "bg-border",
  "bg-muted-foreground",
  "bg-primary",
  "bg-accent",
  "bg-positive",
  "bg-negative",
  "bg-warning",
  "bg-info",
  "bg-chart-grid",
] as const;

export default function Home() {
  return (
    <main className="min-h-dvh bg-background p-6">
      <div className="flex flex-wrap gap-2">
        {SWATCHES.map((swatch) => (
          <span key={swatch} className={`size-8 rounded-md border ${swatch}`} />
        ))}
      </div>
    </main>
  );
}
