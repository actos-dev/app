"use client";

/**
 * Dashboard widget ızgarası (Faz 5B / Birim 5B.1, P-05, P-08, U-07).
 *
 * Sürükle-bırak YOKtur (P-08): düzen sabit ve CSS grid ile kurulur. RSC
 * paketi (`DashboardData`) widget'lara `initialData` olarak geçirilir; böylece
 * istemci ilk boyamada ek istek atmaz. Piyasa durumu tek yerde tohumlanır;
 * `usePollingInterval` aynı sorguyu okuduğu için tüm canlı widget'lar paylaşılan
 * aralığı kullanır (P-04).
 */
import { DigestPreviewWidget } from "@/components/dashboard/DigestPreviewWidget";
import { MarketPulseWidget } from "@/components/dashboard/MarketPulseWidget";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { PortfolioSummaryWidget } from "@/components/dashboard/PortfolioSummaryWidget";
import { QuickActionsWidget } from "@/components/dashboard/QuickActionsWidget";
import { WatchlistWidget } from "@/components/dashboard/WatchlistWidget";
import { useMarketStatus } from "@/lib/query/polling";
import type { DashboardData } from "@/app/(app)/dashboard/dashboard-data";

type DashboardOverviewProps = {
  data: DashboardData;
};

export function DashboardOverview({ data }: DashboardOverviewProps) {
  // Paylaşılan piyasa durumu sorgusunu SSR verisiyle tohumla; ilk boyamada
  // ek `/market/status` isteği atılmaz ve polling kararı hazır olur.
  useMarketStatus(data.status ? { initialData: data.status } : {});

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <OnboardingChecklist
        profile={data.profile}
        favoritesCount={data.favorites.length}
        portfoliosCount={data.summary?.items.length ?? 0}
        className="sm:col-span-2 lg:col-span-3"
      />
      <PortfolioSummaryWidget initialData={data.summary} className="sm:col-span-2" />
      <WatchlistWidget
        initialFavorites={data.favorites}
        initialSummary={data.companies}
        className="sm:col-span-2 lg:col-span-1"
      />
      <MarketPulseWidget initialData={data.pulse} className="sm:col-span-2" />
      <QuickActionsWidget />
      <DigestPreviewWidget
        digest={data.digest.digest}
        failed={data.digest.failed}
        className="sm:col-span-2 lg:col-span-3"
      />
    </div>
  );
}
