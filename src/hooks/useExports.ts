"use client";

/**
 * Veri merkezi (dışa aktarma) kancaları (Faz 5 / Birim 5B.3).
 *
 * İki sorgu vardır: geçmiş listesi (`GET /data/export`) ve poll edilen tek
 * kayıt (`GET /data/export/{id}`). Yeni talep 202 döner ve iş arka planda
 * sürer; tek kayıt sorgusu `queued`/`processing` durumundayken makul bir
 * aralıkla (5 sn) yenilenir, `ready`/`sent`/`failed` olunca poll DURUR
 * (gereksiz agresif poll yok). Sunucu ayrıca e-posta ile indirme bağlantısı
 * gönderir.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ApiError, apiFetch } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";
import { DATA_EXPORT_PATH, exportPath } from "@/lib/data-center/api-paths";
import { downloadExportFile } from "@/lib/data-center/download";
import {
  isActiveExportStatus,
  type ExportCreateResponse,
  type ExportJob,
  type ExportRequestInput,
  type ExportStatus,
} from "@/lib/data-center/types";
import { qk } from "@/lib/query/keys";

/** Sürerken tek kayıt sorgusunun yenileme aralığı (ms). */
export const EXPORT_POLL_INTERVAL_MS = 5_000;

/**
 * Sorgu `refetchInterval` değeri: yalnız aktif durumda poll edilir.
 * Saf fonksiyon; testte aralık davranışı doğrudan doğrulanabilir.
 */
export function exportRefetchInterval(status: ExportStatus | undefined): number | false {
  return isActiveExportStatus(status) ? EXPORT_POLL_INTERVAL_MS : false;
}

/** `GET /data/export` — kullanıcının geçmiş talepleri. */
export function useExports(initialData?: ExportJob[]) {
  return useQuery({
    queryKey: qk.exports.list(),
    queryFn: () => apiFetch<ExportJob[]>(DATA_EXPORT_PATH),
    ...(initialData ? { initialData } : {}),
  });
}

/** `GET /data/export/{id}` — tek talebin durumu; aktifken poll edilir. */
export function useExport(exportId: number | null) {
  return useQuery({
    queryKey: qk.exports.detail(exportId ?? "none"),
    queryFn: () => apiFetch<ExportJob>(exportPath(exportId as number)),
    enabled: exportId !== null,
    refetchInterval: (query) => exportRefetchInterval(query.state.data?.status),
  });
}

/** Yazma hatalarında ortak toast; kod → `apiErrors.*` anahtarına çevrilir. */
function useExportErrorToast() {
  const t = useTranslations();
  return (error: unknown) => {
    toast.error(t(translateBackendError(error instanceof ApiError ? error.code : undefined)));
  };
}

/** `POST /data/export` — yeni talep (202); idempotent olduğundan mevcut id dönebilir. */
export function useCreateExport() {
  const queryClient = useQueryClient();
  const t = useTranslations("dataCenter");
  const showError = useExportErrorToast();

  return useMutation({
    mutationFn: (input: ExportRequestInput) =>
      apiFetch<ExportCreateResponse>(DATA_EXPORT_PATH, {
        method: "POST",
        body: { year: input.year, format: input.format },
      }),
    onSuccess: () => {
      toast.success(t("request.queued"));
      void queryClient.invalidateQueries({ queryKey: qk.exports.all() });
    },
    onError: showError,
  });
}

/** Hazır dosyayı indirir; başarısızlık toast ile bildirilir. */
export function useDownloadExport() {
  const queryClient = useQueryClient();
  const t = useTranslations("dataCenter");
  const showError = useExportErrorToast();

  return useMutation({
    mutationFn: (job: ExportJob) => downloadExportFile(job),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.exports.all() });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        showError(error);
        return;
      }
      toast.error(t("downloadFailed"));
    },
  });
}
