/**
 * `/markets` yüklenme iskeleti (Faz 3 / Birim 3.2).
 *
 * Sekme/veri değişiminde sayfanın RSC'si çözülene kadar gerçek düzeni taklit
 * eden iskelet gösterilir; boş ekran yerine anlamlı bir yüklenme durumu.
 */
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 pb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24" />
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border p-3">
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex flex-col gap-2 p-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
