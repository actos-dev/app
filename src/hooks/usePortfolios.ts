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
  portfolioBenchmarkPath,
  portfolioDiversificationPath,
  portfolioDuplicatePath,
  portfolioHistoryPath,
  portfolioPath,
  portfolioPerformancePath,
  portfolioPerformersPath,
  portfolioReturnsPath,
  portfolioRiskPath,
  portfolioSummariesPath,
  portfolioTransactionPath,
  portfolioTransactionsPath,
  portfolioTransactionsUndoPath,
  portfolioValuationPath,
} from "@/lib/portfolio/api-paths";
import type {
  AddTransactionInput,
  Portfolio,
  PortfolioBenchmark,
  PortfolioDiversification,
  PortfolioHistoryPoint,
  PortfolioMetadata,
  PortfolioPerformance,
  PortfolioPerformers,
  PortfolioReturns,
  PortfolioRiskMetrics,
  PortfolioSummaryResponse,
  PortfolioTransaction,
  PortfolioValuation,
  UpdateTransactionInput,
} from "@/lib/portfolio/types";
import type { AnalyticsPeriod } from "@/lib/portfolio/periods";
import { qk } from "@/lib/query/keys";
import { track } from "@/lib/telemetry";
import { TelemetryEvents } from "@/lib/telemetry-events";
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

/** `GET /portfolios/{id}` — tek portföy detayı; RSC verisiyle tohumlanır. */
export function usePortfolio(id: string, initialData?: Portfolio) {
  return useQuery({
    queryKey: qk.portfolio(id),
    queryFn: () => apiFetch<Portfolio>(portfolioPath(id)),
    ...(initialData ? { initialData } : {}),
  });
}

/** `GET /portfolios/{id}/valuation` — güncel değerleme; RSC verisiyle tohumlanır. */
export function usePortfolioValuation(id: string, initialData?: PortfolioValuation | null) {
  return useQuery({
    queryKey: qk.portfolioValuation(id),
    queryFn: () => apiFetch<PortfolioValuation>(portfolioValuationPath(id)),
    ...(initialData ? { initialData } : {}),
  });
}

/** `GET /portfolios/{id}/transactions` — işlem geçmişi; RSC verisiyle tohumlanır. */
export function usePortfolioTransactions(id: string, initialData?: PortfolioTransaction[]) {
  return useQuery({
    queryKey: qk.portfolioTransactions(id),
    queryFn: () => apiFetch<PortfolioTransaction[]>(portfolioTransactionsPath(id)),
    ...(initialData ? { initialData } : {}),
  });
}

/**
 * Analiz sorguları (Faz 4 / Birim 4.3).
 *
 * Bu uçlar pahalıdır (fiyat geçmişi fan-out'u) ve yalnız ilgili sekme
 * açıldığında çağrılmalıdır. Sekme içerikleri `Tabs` tarafından koşullu
 * mount edildiğinden varsayılan `enabled: true` güvenlidir; çağıran taraf
 * gerekirse `enabled` ile kapatabilir.
 */
type AnalyticsOptions = { enabled?: boolean };

/** `GET /portfolios/{id}/diversification` — varlık sınıfı/pozisyon dağılımı. */
export function usePortfolioDiversification(id: string, options: AnalyticsOptions = {}) {
  return useQuery({
    queryKey: qk.portfolioDiversification(id),
    queryFn: () => apiFetch<PortfolioDiversification>(portfolioDiversificationPath(id)),
    enabled: options.enabled ?? true,
  });
}

/** `GET /portfolios/{id}/performers` — en iyi/en kötü pozisyonlar (top 5). */
export function usePortfolioPerformers(id: string, options: AnalyticsOptions = {}) {
  return useQuery({
    queryKey: qk.portfolioPerformers(id),
    queryFn: () => apiFetch<PortfolioPerformers>(portfolioPerformersPath(id)),
    enabled: options.enabled ?? true,
  });
}

/** `GET /portfolios/{id}/history?period=` — portföy değeri zaman serisi. */
export function usePortfolioHistory(
  id: string,
  period: AnalyticsPeriod,
  options: AnalyticsOptions = {},
) {
  return useQuery({
    queryKey: qk.portfolioHistory(id, period),
    queryFn: () =>
      apiFetch<PortfolioHistoryPoint[]>(portfolioHistoryPath(id), { query: { period } }),
    enabled: options.enabled ?? true,
  });
}

/** `GET /portfolios/{id}/returns?period=` — dönem getirisi ve CAGR. */
export function usePortfolioReturns(
  id: string,
  period: AnalyticsPeriod,
  options: AnalyticsOptions = {},
) {
  return useQuery({
    queryKey: qk.portfolioReturns(id, period),
    queryFn: () => apiFetch<PortfolioReturns>(portfolioReturnsPath(id), { query: { period } }),
    enabled: options.enabled ?? true,
  });
}

/** `GET /portfolios/{id}/risk?period=` — volatilite, max drawdown, Sharpe. */
export function usePortfolioRisk(
  id: string,
  period: AnalyticsPeriod,
  options: AnalyticsOptions = {},
) {
  return useQuery({
    queryKey: qk.portfolioRisk(id, period),
    queryFn: () => apiFetch<PortfolioRiskMetrics>(portfolioRiskPath(id), { query: { period } }),
    enabled: options.enabled ?? true,
  });
}

/** `GET /portfolios/{id}/benchmark?ticker=XU100` — kıyas; veri yoksa `{}`. */
export function usePortfolioBenchmark(
  id: string,
  ticker = "XU100",
  options: AnalyticsOptions = {},
) {
  return useQuery({
    queryKey: qk.portfolioBenchmark(id, ticker),
    queryFn: () => apiFetch<PortfolioBenchmark>(portfolioBenchmarkPath(id), { query: { ticker } }),
    enabled: options.enabled ?? true,
  });
}

/** `GET /portfolios/{id}/performance` — işlem verimliliği analizi. */
export function usePortfolioPerformance(id: string, options: AnalyticsOptions = {}) {
  return useQuery({
    queryKey: qk.portfolioPerformance(id),
    queryFn: () => apiFetch<PortfolioPerformance>(portfolioPerformancePath(id)),
    enabled: options.enabled ?? true,
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

/** `PUT /portfolios/{id}` — portföyü yeniden adlandır. */
export function useRenamePortfolio() {
  const queryClient = useQueryClient();
  const t = useTranslations("portfolio");
  const showError = usePortfolioErrorToast();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiFetch(portfolioPath(id), { method: "PUT", body: { name } }),
    onSuccess: () => {
      toast.success(t("rename.success"));
      void queryClient.invalidateQueries({ queryKey: qk.portfolios() });
    },
    onError: showError,
  });
}

/**
 * `POST /portfolios/{id}/transactions` — al/sat.
 *
 * Başarıda `qk.portfolios()` kökü tazelenir; bu tek çağrı detay, değerleme,
 * işlem geçmişi ve özet listesini birlikte günceller (P-03). Backend kuralı
 * gereği seans kapalıysa `error_market_closed` döner ve toast'a i18n metni yazılır.
 */
export function useAddTransaction(id: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("portfolio");
  const showError = usePortfolioErrorToast();

  return useMutation({
    mutationFn: (input: AddTransactionInput) =>
      apiFetch(portfolioTransactionsPath(id), {
        method: "POST",
        body: { ticker: input.ticker, type: input.type, quantity: input.quantity },
      }),
    onSuccess: (_data, variables) => {
      // S-10: al/sat (rıza yoksa no-op); PII gönderilmez.
      track(TelemetryEvents.tradeExecuted, {
        ticker: variables.ticker,
        action: variables.type,
      });
      toast.success(
        variables.type === "BUY" ? t("trade.successBuy") : t("trade.successSell"),
      );
      void queryClient.invalidateQueries({ queryKey: qk.portfolios() });
    },
    onError: showError,
  });
}

/** `DELETE /portfolios/{id}/transactions/undo` — son işlemi geri al. */
export function useUndoLastTransaction(id: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("portfolio");
  const showError = usePortfolioErrorToast();

  return useMutation({
    mutationFn: () => apiFetch(portfolioTransactionsUndoPath(id), { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("undo.success"));
      void queryClient.invalidateQueries({ queryKey: qk.portfolios() });
    },
    onError: showError,
  });
}

/** `PUT /portfolios/{id}/transactions/{tx_id}` — işlem fiyat/adet düzeltme. */
export function useUpdateTransaction(id: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("portfolio");
  const showError = usePortfolioErrorToast();

  return useMutation({
    mutationFn: ({ txId, input }: { txId: string; input: UpdateTransactionInput }) =>
      apiFetch(portfolioTransactionPath(id, txId), {
        method: "PUT",
        body: {
          ...(input.price !== undefined ? { price: input.price } : {}),
          ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
        },
      }),
    onSuccess: () => {
      toast.success(t("edit.success"));
      void queryClient.invalidateQueries({ queryKey: qk.portfolios() });
    },
    onError: showError,
  });
}
