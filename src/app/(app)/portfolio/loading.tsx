/**
 * `/portfolio` yüklenme iskeleti (Faz 4 / Birim 4.1).
 *
 * RSC çözülene kadar başlık + kart ızgarası iskeleti gösterilir.
 */
import { PortfolioListSkeleton } from "@/components/portfolio/PortfolioListSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortfolioLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 pb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>
      <PortfolioListSkeleton />
    </div>
  );
}
