"use client";

/**
 * Profil sorgu/mutasyon kancaları (Faz 5 / Birim 5B.2, U-11, S-07, B-15).
 *
 * RSC `GET /profile` verisini `initialData` ile tohumlar; bu sayede ilk
 * boyamada ek istek olmaz. Mutasyonlar başarıda ilgili alanı query
 * önbelleğinde günceller (ek GET yok). Hata metni bileşen katmanında
 * `translateBackendError` ile çevrilir; bu kancalar görünen metin üretmez.
 *
 * Tema/dil tercihi (B-15) **best-effort**tır: yazma başarısız olsa da
 * (ör. kullanıcının `user_preferences` satırı yoksa 404) akış devam eder,
 * çerez yine SSR kaynağıdır.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import {
  CHANGE_EMAIL_PATH,
  CHANGE_PASSWORD_PATH,
  CHANGE_USERNAME_PATH,
  DELETE_ACCOUNT_PATH,
  PROFILE_PATH,
  USER_PREFERENCES_PATH,
} from "@/lib/profile/api-paths";
import type { Profile } from "@/lib/profile/types";
import { qk } from "@/lib/query/keys";
import type { components } from "@/types/generated";

/** Değişim yoksa `initialData` bayatlamasın diye uzun taze kalma süresi. */
const PROFILE_STALE_TIME_MS = 5 * 60_000;

type ChangeUsernameResponse = { message: string; new_username: string };
type ChangeEmailResponse = { message: string; new_email: string };

/** `GET /profile` — RSC verisiyle tohumlanır. */
export function useProfile(initialData?: Profile) {
  return useQuery({
    queryKey: qk.profile(),
    queryFn: () => apiFetch<Profile>(PROFILE_PATH),
    ...(initialData ? { initialData } : {}),
    staleTime: PROFILE_STALE_TIME_MS,
  });
}

/** `PUT /auth/change-username` — mevcut şifre doğrulanır. */
export function useUpdateUsername() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: components["schemas"]["UpdateUsername"]) =>
      apiFetch<ChangeUsernameResponse>(CHANGE_USERNAME_PATH, { method: "PUT", body: input }),
    onSuccess: (data) => {
      queryClient.setQueryData<Profile>(qk.profile(), (previous) =>
        previous ? { ...previous, username: data.new_username } : previous,
      );
    },
  });
}

/** `PUT /auth/change-email` — mevcut şifre doğrulanır. */
export function useUpdateEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: components["schemas"]["UpdateEmail"]) =>
      apiFetch<ChangeEmailResponse>(CHANGE_EMAIL_PATH, { method: "PUT", body: input }),
    onSuccess: (data) => {
      queryClient.setQueryData<Profile>(qk.profile(), (previous) =>
        previous ? { ...previous, email: data.new_email } : previous,
      );
    },
  });
}

/** `PUT /auth/change-password` — başarıda backend tüm refresh token'ları iptal
 * eder ve `password_changed_at` güncellenir; mevcut oturum da geçersizleşir.
 * Yönlendirme/çıkış kararı çağıran bileşendedir.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: components["schemas"]["ChangePassword"]) =>
      apiFetch<{ message: string }>(CHANGE_PASSWORD_PATH, { method: "PUT", body: input }),
  });
}

/** `DELETE /auth/delete` — hesabı kalıcı siler; sonrasında çıkış çağıranın işidir. */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => apiFetch<{ message: string }>(DELETE_ACCOUNT_PATH, { method: "DELETE" }),
  });
}

/**
 * `PUT /user/preferences` — tema/dil tercihini hesaba yazar (B-15).
 *
 * Best-effort: başarısızlık kullanıcıya gösterilmez ve akışı kesmez; SSR
 * tercihi her hâlükârda çerezden çözer. Bu yüzden bilinçli olarak toast veya
 * hata durumu üretmez.
 */
export function useSavePreferences() {
  return useMutation({
    mutationFn: (prefs: Record<string, unknown>) =>
      apiFetch(USER_PREFERENCES_PATH, { method: "PUT", body: { prefs } }),
  });
}
