"use client";

/**
 * Portföy listesi (Faz 4 / Birim 4.1, B-10, P-02, S-11).
 *
 * Veri RSC'den `initialData` olarak gelir; istemci ilk boyamada ek istek atmaz
 * ve portföy başına valuation çağrısı YOKTUR (N+1 yok). İki mod desteklenir:
 *   - `summaries`: tek `/portfolios/summaries` isteği, kartlarda değerleme,
 *   - `fallback`: backend gerideyse `/portfolios` ham listesi; değerleme "—".
 * Hata/429 durumunda `ErrorState` + tekrar dene (RSC yeniden çalıştırılır).
 */
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import {
  useDuplicatePortfolio,
  usePortfolioList,
  usePortfolioSummaries,
} from "@/hooks/usePortfolios";
import type { PortfolioListData } from "@/lib/portfolio/list";
import type { PortfolioMetadata, PortfolioSummary } from "@/lib/portfolio/types";

import { PortfolioCard, type PortfolioCardModel } from "./PortfolioCard";
import { PortfolioCreateDialog } from "./PortfolioCreateDialog";
import { PortfolioListSkeleton } from "./PortfolioListSkeleton";

type PortfolioListProps = {
  data: PortfolioListData;
};

/** Özet kaydını kart görünümüne indirger. */
function toSummaryModel(item: PortfolioSummary): PortfolioCardModel {
  return {
    id: item.id,
    name: item.name,
    currency: item.currency,
    currentValue: item.current_value,
    dailyChangePct: item.daily_change_pct,
    totalReturnPct: item.total_return_pct,
    positionCount: item.position_count,
    asOf: item.as_of,
  };
}

/** Fallback metadata'sını kart görünümüne indirger; değerleme alanları yok. */
function toMetadataModel(item: PortfolioMetadata): PortfolioCardModel {
  return {
    id: item.id,
    name: item.name,
    currency: null,
    currentValue: null,
    dailyChangePct: null,
    totalReturnPct: null,
    positionCount: null,
    asOf: null,
  };
}

export function PortfolioList({ data }: PortfolioListProps) {
  const t = useTranslations("portfolio");
  const router = useRouter();
  const duplicate = useDuplicatePortfolio();

  const fallback = data.mode === "fallback";

  const summaries = usePortfolioSummaries({
    enabled: !fallback,
    ...(data.mode === "summaries" ? { initialData: { items: data.items } } : {}),
  });

  const list = usePortfolioList({
    enabled: fallback,
    ...(data.mode === "fallback" ? { initialData: data.items } : {}),
  });

  const models = useMemo<PortfolioCardModel[]>(() => {
    if (fallback) {
      return (list.data ?? []).map(toMetadataModel);
    }
    return (summaries.data?.items ?? []).map(toSummaryModel);
  }, [fallback, list.data, summaries.data]);

  const query = fallback ? list : summaries;

  if (query.isLoading) {
    return <PortfolioListSkeleton />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title={t("error.title")}
        description={t("error.description")}
        retry={{ label: t("error.retry"), onRetry: () => router.refresh() }}
      />
    );
  }

  if (models.length === 0) {
    return (
      <EmptyState
        icon={<Wallet aria-hidden="true" className="size-5" />}
        title={t("empty.title")}
        description={t("empty.description")}
        action={
          <PortfolioCreateDialog
            trigger={<Button>{t("empty.cta")}</Button>}
          />
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {fallback ? (
        <p role="status" className="text-xs text-muted-foreground">
          {t("fallbackNotice")}
        </p>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {models.map((model) => (
          <PortfolioCard
            key={model.id}
            portfolio={model}
            duplicating={duplicate.isPending}
            onDuplicate={(portfolio) =>
              duplicate.mutate({ id: portfolio.id, name: portfolio.name })
            }
          />
        ))}
      </ul>
    </div>
  );
}
