"use client";

/**
 * Duyuru sorgu/mutasyon kancaları (Faz 5 / Birim 5B.3).
 *
 * Tek liste sorgusu (`GET /announcements`) topbar zili ile yönetici sekmesi
 * arasında paylaşılır; tüm mutasyonlar aynı anahtarı tazeler. Okundu işareti
 * önce önbellekte iyimser güncellenir, sonra sunucudan doğrulanır.
 *
 * ÖNEMLİ: `POST/PUT/DELETE /announcements` yalnızca `user_type === 'admin'`
 * için çalışır. İstemci kapısı SADECE UX'tir; gerçek yetki backend'de
 * `_is_admin` ile uygulanır ve 403 `Admin access required` döner.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ApiError, apiFetch } from "@/lib/api/client";
import {
  ANNOUNCEMENTS_PATH,
  ANNOUNCEMENTS_READ_PATH,
  announcementPath,
} from "@/lib/announcements/api-paths";
import type {
  AnnouncementInput,
  AnnouncementListResponse,
} from "@/lib/announcements/types";
import { translateBackendError } from "@/lib/backend-errors";
import { qk } from "@/lib/query/keys";

/** `GET /announcements` — kullanıcıya görünen duyurular + okunmamış bilgisi. */
export function useAnnouncements(initialData?: AnnouncementListResponse) {
  return useQuery({
    queryKey: qk.announcements.list(),
    queryFn: () => apiFetch<AnnouncementListResponse>(ANNOUNCEMENTS_PATH),
    ...(initialData ? { initialData } : {}),
  });
}

/** Yazma hatalarında ortak toast; kod → `apiErrors.*` anahtarına çevrilir. */
function useAnnouncementErrorToast() {
  const t = useTranslations();
  return (error: unknown) => {
    toast.error(t(translateBackendError(error instanceof ApiError ? error.code : undefined)));
  };
}

/**
 * `POST /announcements/read` — tüm duyuruları okundu işaretler.
 *
 * Önbellek iyimser güncellenir (`is_unread: false`), ardından liste tazelenir.
 */
export function useMarkAnnouncementsRead() {
  const queryClient = useQueryClient();
  const showError = useAnnouncementErrorToast();

  return useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>(ANNOUNCEMENTS_READ_PATH, { method: "POST" }),
    onMutate: () => {
      queryClient.setQueryData<AnnouncementListResponse>(
        qk.announcements.list(),
        (previous) =>
          previous
            ? {
                announcements: previous.announcements.map((announcement) => ({
                  ...announcement,
                  is_unread: false,
                })),
              }
            : previous,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.announcements.list() });
    },
    onError: showError,
  });
}

/** `POST /announcements` — yeni duyuru (yalnız admin). */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const t = useTranslations("announcements.admin");
  const showError = useAnnouncementErrorToast();

  return useMutation({
    mutationFn: (input: AnnouncementInput) =>
      apiFetch(ANNOUNCEMENTS_PATH, { method: "POST", body: { ...input } }),
    onSuccess: () => {
      toast.success(t("created"));
      void queryClient.invalidateQueries({ queryKey: qk.announcements.list() });
    },
    onError: showError,
  });
}

/** `PUT /announcements/{id}` — duyuruyu düzenle (yalnız admin). */
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  const t = useTranslations("announcements.admin");
  const showError = useAnnouncementErrorToast();

  return useMutation({
    mutationFn: ({ id, title, content }: AnnouncementInput & { id: number }) =>
      apiFetch(announcementPath(id), { method: "PUT", body: { title, content } }),
    onSuccess: () => {
      toast.success(t("updated"));
      void queryClient.invalidateQueries({ queryKey: qk.announcements.list() });
    },
    onError: showError,
  });
}

/** `DELETE /announcements/{id}` — duyuruyu sil (yalnız admin). */
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  const t = useTranslations("announcements.admin");
  const showError = useAnnouncementErrorToast();

  return useMutation({
    mutationFn: (announcementId: number) =>
      apiFetch(announcementPath(announcementId), { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("deleted"));
      void queryClient.invalidateQueries({ queryKey: qk.announcements.list() });
    },
    onError: showError,
  });
}
