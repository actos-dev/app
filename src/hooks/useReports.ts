"use client";

/**
 * Rapor sorgu/mutasyon kancaları (Faz 5 / Birim 5A.1, U-03, U-06, U-09, K-09).
 *
 * Sunucu bileşenleri ilk veriyi `initialData` olarak tohumlar; böylece ilk
 * boyamada çift istek olmaz. Başarılı üretim sonrası geçmiş + kredi tazelenir
 * ve dönen `remaining_credits` önbelleğe yazılır (U-03).
 *
 * Bilinçli sınır: B-09 (job/ilerleme ucu) henüz yok; üretim SENKRON tek HTTP
 * isteğidir (30-60 sn). Bu katman iptal/gerçek yüzde sunmaz; UI yalnız geçen
 * süreyi ve dürüst bir aşama metnini gösterir.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ApiError, apiFetch } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";
import { qk, type ReportHistoryParams, type ReportSearchParams } from "@/lib/query/keys";
import {
  CREDITS_PATH,
  REPORTS_GENERATE_PATH,
  REPORTS_HISTORY_PATH,
  REPORTS_INFO_PATH,
  REPORTS_SEARCH_PATH,
} from "@/lib/reports/api-paths";
import type {
  CreditsResponse,
  GenerateReportResponse,
  ReportHistoryItem,
  ReportInfo,
  ReportType,
} from "@/lib/reports/types";

/** `GET /reports/info` — rapor tipleri ve tahmini maliyetler. */
export function useReportInfo(initialData?: ReportInfo) {
  return useQuery({
    queryKey: qk.reports.info(),
    queryFn: () => apiFetch<ReportInfo>(REPORTS_INFO_PATH),
    ...(initialData ? { initialData } : {}),
    // Fiyatlandırma seyrek değişir; tüm oturum boyunca taze sayılır.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/** `GET /reports/history` — rapor geçmişi (sunucu sıralaması). */
export function useReportHistory(
  params: ReportHistoryParams = {},
  initialData?: ReportHistoryItem[],
) {
  return useQuery({
    queryKey: qk.reports.history(params),
    queryFn: () =>
      apiFetch<ReportHistoryItem[]>(REPORTS_HISTORY_PATH, {
        query: { sort: params.sort ?? "created_at", order: params.order ?? "desc" },
      }),
    ...(initialData ? { initialData } : {}),
  });
}

/**
 * `GET /reports/search` — başlık/içerik araması (sunucu sayfalaması).
 *
 * `query` boşken sorgu kapalıdır; çağıran taraf boş aramada `useReportHistory`
 * kullanır. `offset` sunucuya aynen geçirilir.
 */
export function useReportSearch(query: string, params: ReportSearchParams = {}) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: qk.reports.search(trimmed, params),
    queryFn: () =>
      apiFetch<ReportHistoryItem[]>(REPORTS_SEARCH_PATH, {
        query: {
          q: trimmed,
          sort: params.sort ?? "created_at",
          order: params.order ?? "desc",
          limit: params.limit ?? 20,
          offset: params.offset ?? 0,
        },
      }),
    enabled: trimmed.length > 0,
  });
}

/** `GET /credits` — toplam kredi bakiyesi (U-03). */
export function useCredits(initialData?: CreditsResponse) {
  return useQuery({
    queryKey: qk.credits(),
    queryFn: () => apiFetch<CreditsResponse>(CREDITS_PATH),
    ...(initialData ? { initialData } : {}),
  });
}

/** Üretim gövdesi; `purpose` yoksa backend'e gönderilmez. */
export type GenerateReportInput = {
  ticker: string;
  type: ReportType;
  purpose?: string;
};

/** Yazma hatalarında ortak toast; kod → `apiErrors.*` anahtarına çevrilir. */
function useReportErrorToast() {
  const t = useTranslations();
  return (error: unknown) => {
    toast.error(t(translateBackendError(error instanceof ApiError ? error.code : undefined)));
  };
}

/**
 * `POST /reports/generate` — senkron üretim.
 *
 * Başarıda: kredi bakiyesi yanıttan güncellenir, geçmiş/arama ve kredi
 * sorguları tazelenir (U-03). Hata `detail` kodu toast'a i18n metni olarak
 * yazılır; ham backend metni ekrana basılmaz (B-07).
 */
export function useGenerateReport() {
  const queryClient = useQueryClient();
  const t = useTranslations("reports");
  const showError = useReportErrorToast();

  return useMutation({
    mutationFn: (input: GenerateReportInput) =>
      apiFetch<GenerateReportResponse>(REPORTS_GENERATE_PATH, {
        method: "POST",
        query: {
          ticker: input.ticker,
          type: input.type,
          ...(input.purpose ? { purpose: input.purpose } : {}),
        },
      }),
    onSuccess: (data) => {
      toast.success(t("wizard.success.title"));
      queryClient.setQueryData<CreditsResponse>(qk.credits(), { credits: data.remaining_credits });
      void queryClient.invalidateQueries({ queryKey: qk.reports.list() });
      void queryClient.invalidateQueries({ queryKey: qk.credits() });
    },
    onError: showError,
  });
}
