"use client";

/**
 * Bot sorgu/mutasyon kancaları (Faz 5 / Birim 5B.3).
 *
 * Listeyi `GET /bots`tan okur; oluşturma/silme başarısında tek invalidation
 * (`qk.bots()`) tazeler ve kısa bir başarı toast'ı gösterir. Hata `detail`
 * kodu `translateBackendError` ile i18n metnine çevrilir; ham backend metni
 * ekrana basılmaz (B-07). Bot limiti (`error_bot_limit_reached`) bu yolla
 * kullanıcıya bildirilir.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ApiError, apiFetch } from "@/lib/api/client";
import { BOTS_PATH, botPath } from "@/lib/bots/api-paths";
import type { BotCreateInput, BotCreateResponse, BotListResponse } from "@/lib/bots/types";
import { translateBackendError } from "@/lib/backend-errors";
import { qk } from "@/lib/query/keys";

/** `GET /bots` — kullanıcının bot hesapları. */
export function useBots(initialData?: BotListResponse) {
  return useQuery({
    queryKey: qk.bots(),
    queryFn: () => apiFetch<BotListResponse>(BOTS_PATH),
    ...(initialData ? { initialData } : {}),
  });
}

/** Yazma hatalarında ortak toast; kod → `apiErrors.*` anahtarına çevrilir. */
function useBotErrorToast() {
  const t = useTranslations();
  return (error: unknown) => {
    toast.error(t(translateBackendError(error instanceof ApiError ? error.code : undefined)));
  };
}

/** `POST /bots` — yeni bot hesabı; dönen tek seferlik şifre çağırana verilir. */
export function useCreateBot() {
  const queryClient = useQueryClient();
  const t = useTranslations("bots");
  const showError = useBotErrorToast();

  return useMutation({
    mutationFn: (input: BotCreateInput) =>
      apiFetch<BotCreateResponse>(BOTS_PATH, {
        method: "POST",
        body: {
          username: input.username,
          ...(input.password ? { password: input.password } : {}),
        },
      }),
    onSuccess: () => {
      toast.success(t("created"));
      void queryClient.invalidateQueries({ queryKey: qk.bots() });
    },
    onError: showError,
  });
}

/** `DELETE /bots/{id}` — sahibin botunu siler. */
export function useDeleteBot() {
  const queryClient = useQueryClient();
  const t = useTranslations("bots");
  const showError = useBotErrorToast();

  return useMutation({
    mutationFn: (botId: number) => apiFetch<{ message: string }>(botPath(botId), { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("deleted"));
      void queryClient.invalidateQueries({ queryKey: qk.bots() });
    },
    onError: showError,
  });
}
