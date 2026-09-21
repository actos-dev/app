"use client";

/**
 * Favori toggle (Faz 3 / Birim 3.3, U-12).
 *
 * İlk durum tek `GET /favorites` isteğinden okunur (`qk.favorites()` tüm
 * kullanımlarda paylaşılır). Ekleme/çıkarma **optimistic** uygulanır; istek
 * başarısız olursa önceki önbellek geri yazılır ve hata toast'ı gösterilir.
 * Aynı sembole hızlı çift tıklama `inFlight` kümesiyle yutulur (çift istek yok).
 *
 * Hook bilinçli olarak sembolden bağımsızdır; çağıran `toggle(ticker)` ve
 * `isFavorite(ticker)` ile çalışır (3.4'te watchlist yeniden kullanır).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useRef } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api/client";
import { favoritesTickerPath } from "@/lib/markets/api-paths";
import { qk } from "@/lib/query/keys";
import type { FavoritesResponse } from "@/types/favorites";

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

type ToggleVariables = {
  ticker: string;
  next: boolean;
};

export type UseFavoritesResult = {
  favorites: string[];
  isFavorite: (ticker: string) => boolean;
  isLoading: boolean;
  isPending: boolean;
  toggle: (ticker: string) => void;
};

export function useFavorites(): UseFavoritesResult {
  const queryClient = useQueryClient();
  const t = useTranslations("symbol.favorite");
  const inFlight = useRef<Set<string>>(new Set());

  const query = useQuery({
    queryKey: qk.favorites(),
    queryFn: () => apiFetch<FavoritesResponse>("/api/v1/favorites"),
  });

  const mutation = useMutation({
    mutationFn: ({ ticker, next }: ToggleVariables) =>
      apiFetch(favoritesTickerPath(ticker), { method: next ? "POST" : "DELETE" }),

    onMutate: async ({ ticker, next }) => {
      await queryClient.cancelQueries({ queryKey: qk.favorites() });
      const previous = queryClient.getQueryData<FavoritesResponse>(qk.favorites());
      const current = previous?.favorites ?? [];
      const updated = next
        ? Array.from(new Set([...current, ticker]))
        : current.filter((item) => item !== ticker);
      queryClient.setQueryData<FavoritesResponse>(qk.favorites(), { favorites: updated });
      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(qk.favorites(), context.previous);
      }
      toast.error(t("error"));
    },

    onSuccess: (_data, variables) => {
      toast.success(variables.next ? t("added") : t("removed"));
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.favorites() });
    },
  });

  const toggle = useCallback(
    (ticker: string) => {
      const normalized = normalizeTicker(ticker);
      if (normalized.length === 0 || inFlight.current.has(normalized)) {
        return;
      }
      const favorites =
        queryClient.getQueryData<FavoritesResponse>(qk.favorites())?.favorites ?? [];
      const next = !favorites.includes(normalized);
      inFlight.current.add(normalized);
      mutation.mutate(
        { ticker: normalized, next },
        {
          onSettled: () => {
            inFlight.current.delete(normalized);
          },
        },
      );
    },
    [mutation, queryClient],
  );

  const isFavorite = useCallback(
    (ticker: string) => (query.data?.favorites ?? []).includes(normalizeTicker(ticker)),
    [query.data],
  );

  return {
    favorites: query.data?.favorites ?? [],
    isFavorite,
    isLoading: query.isLoading,
    isPending: mutation.isPending,
    toggle,
  };
}
