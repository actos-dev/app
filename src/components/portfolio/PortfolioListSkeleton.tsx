/**
 * Portföy kartları yüklenme iskeleti (Faz 4 / Birim 4.1).
 *
 * RSC çözülene kadar gerçek kart düzenini taklit eder; `loading.tsx` ve
 * istemci sorgu yüklenmesi aynı iskeleti paylaşır.
 */
import { Skeleton } from "@/components/ui/skeleton";

export function PortfolioListSkeleton() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <li
          key={index}
          className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="size-8" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-3 w-24" />
        </li>
      ))}
    </ul>
  );
}
