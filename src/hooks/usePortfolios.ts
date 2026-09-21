"use client";

/**
 * Portföy sorgu/mutasyon kancaları (Faz 4 / Birim 4.1, P-03, U-05).
 *
 * Liste ekranı iki kaynağı destekler: öncelikli `summaries` (B-10) ve backend
 * gerideyse ham `list`. Her ikisi de `qk.portfolios()` kökü altındadır; bir
 * yazma işlemi sonrası TEK invalidation ikisini de tazeler.
 *
 * Yazma işlemleri toast ile geri bildirir; hata metni backend `detail` kodundan
 * `translateBackendError` ile i18n anahtarına çevrilir (B-07) ve ham metin
 * ekrana basılmaz.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ApiError, apiFetch } from "@/lib/api/client";
import {
  PORTFOLIOS_PATH,
  portfolioDuplicatePath,
  portfolioPath,
  portfolioSummariesPath,
} from "@/lib/portfolio/api-paths";
import type {
  Portfolio,
  PortfolioMetadata,
  PortfolioSummaryResponse,
} from "@/lib/portfolio/types";
import { qk } from "@/lib/query/keys";
import { translateBackendError } from "@/lib/backend-errors";

type InitialOptions<T> = {
  /** RSC'den gelen başlangıç verisi; verilirse istemci ek istek atmaz. */
  initialData?: T;
  /** Sorgu kapalıysa (ör. fallback modunda summaries) `false`. */
  enabled?: boolean;
};

/** `GET /portfolios/summaries` — değerlemeli liste (B-10). */
export function usePortfolioSummaries(options: InitialOptions<PortfolioSummaryResponse> = {}) {
  return useQuery({
    queryKey: qk.portfolioSummaries(),
    queryFn: () => apiFetch<PortfolioSummaryResponse>(portfolioSummariesPath()),
    enabled: options.enabled ?? true,
    ...(options.initialData ? { initialData: options.initialData } : {}),
  });
}

/** `GET /portfolios` — ham liste; yalnız metadata'ya indirgenir (N+1 yok). */
export function usePortfolioList(options: InitialOptions<PortfolioMetadata[]> = {}) {
  return useQuery({
    queryKey: qk.portfolioList(),
    queryFn: async () =>
      (await apiFetch<Portfolio[]>(PORTFOLIOS_PATH)).map((portfolio) => portfolio.metadata),
    enabled: options.enabled ?? true,
    ...(options.initialData ? { initialData: options.initialData } : {}),
  });
}

/** Yazma işlemlerinde ortak hata toast'ı; kod → `apiErrors.*` anahtarına çevrilir. */
function usePortfolioErrorToast() {
  const t = useTranslations();
  return (error: unknown) => {
    toast.error(t(translateBackendError(error instanceof ApiError ? error.code : undefined)));
  };
}

export type CreatePortfolioInput = {
  name: string;
  initialBalance: number;
};

/** `POST /portfolios` — yeni portföy; başarıda tüm portföy sorguları tazelenir. */
export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  const t = useTranslations("portfolio");
  const showError = usePortfolioErrorToast();

  return useMutation({
    mutationFn: ({ name, initialBalance }: CreatePortfolioInput) =>
      apiFetch<Portfolio>(PORTFOLIOS_PATH, {
        method: "POST",
        body: { name, initial_balance: initialBalance },
      }),
    onSuccess: () => {
      toast.success(t("create.success"));
      void queryClient.invalidateQueries({ queryKey: qk.portfolios() });
    },
    onError: showError,
  });
}

/** `POST /portfolios/{id}/duplicate` — ad backend'de zorunlu; "kopya" soneki eklenir. */
export function useDuplicatePortfolio() {
  const queryClient = useQueryClient();
  const t = useTranslations("portfolio");
  const showError = usePortfolioErrorToast();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiFetch<Portfolio>(portfolioDuplicatePath(id), {
        method: "POST",
        body: { name: t("duplicate.nameSuffix", { name }) },
      }),
    onSuccess: () => {
      toast.success(t("duplicate.success"));
      void queryClient.invalidateQueries({ queryKey: qk.portfolios() });
    },
    onError: showError,
  });
}

/** `DELETE /portfolios/{id}` — onay diyaloğundan sonra çağrılır. */
export function useDeletePortfolio() {
  const queryClient = useQueryClient();
  const t = useTranslations("portfolio");
  const showError = usePortfolioErrorToast();

  return useMutation({
    mutationFn: (id: string) => apiFetch(portfolioPath(id), { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("delete.success"));
      void queryClient.invalidateQueries({ queryKey: qk.portfolios() });
    },
    onError: showError,
  });
}
