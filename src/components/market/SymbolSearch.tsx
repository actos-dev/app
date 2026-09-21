"use client";

/**
 * Sembol arama (Faz 3 / Birim 3.2, A-02, U-10 temeli; P-03 temizliği).
 *
 * Base UI Autocomplete kullanılır: `role="combobox"`, `aria-expanded`,
 * `aria-controls`, `aria-activedescendant`, ok tuşları, Enter ile seçim,
 * Escape ile kapatma ve dışarı tıklama davranışı Base UI'dan gelir. Sorgu
 * sunucu tarafında (`/companies/search`) yapılır: en az 2 karakter, 250 ms
 * debounce.
 *
 * Sonuçlar React Query ile `qk.companySearch(query)` anahtarı üzerinden
 * yönetilir; aynı terim 60 sn taze sayılır ve modül düzeyi özel önbellek
 * yerine paylaşılan sorgu önbelleği kullanılır (P-03). Base UI `items`'ı
 * doğrudan DOM listesinden okur; yüklenme/hata/boş bilgisi popup içindeki bir
 * "durum" düğümüne yazılır.
 */
import { Autocomplete } from "@base-ui/react/autocomplete";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiFetch } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import { cn } from "@/lib/utils";
import type { CompanySearchResult } from "@/types/market";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;
/** Aynı terimin yeniden kullanılma süresi (P-03). */
const SEARCH_STALE_MS = 60_000;

type StatusKind = "idle" | "loading" | "error" | "empty" | "short";

type SymbolSearchProps = {
  className?: string;
  /**
   * Seçim yapıldığında çağrılır; verilirse sembol sayfasına YÖNLENDİRME
   * yapılmaz (al/sat diyaloğu gibi gömülü kullanımlar için). Verilmezse
   * varsayılan davranış `/symbol/{ticker}`'a gitmektir.
   */
  onSelect?: (ticker: string, name: string) => void;
  /** Gömülü kullanım için etiket bağlantısı (`FormField` kontrol nitelikleri). */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
  placeholder?: string;
};

export function SymbolSearch({
  className,
  onSelect,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  placeholder,
}: SymbolSearchProps) {
  const t = useTranslations("markets.search");
  const router = useRouter();

  const [term, setTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = term.trim();

  const searchQuery = useQuery({
    queryKey: qk.companySearch(debouncedTerm),
    queryFn: ({ signal }) =>
      apiFetch<CompanySearchResult[]>("/api/v1/companies/search", {
        query: { query: debouncedTerm },
        signal,
      }),
    enabled: debouncedTerm.length >= MIN_QUERY_LENGTH,
    staleTime: SEARCH_STALE_MS,
  });

  const items = useMemo(() => searchQuery.data ?? [], [searchQuery.data]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Debounce olay işleyicisinde kurulur (effect içinde senkron setState yok):
  // her tuş vuruşunda zamanlayıcı sıfırlanır, yalnız duraklamadan sonra sorgu
  // anahtarı güncellenir.
  const scheduleSearch = useCallback((value: string) => {
    const next = value.trim();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (next.length < MIN_QUERY_LENGTH) {
      setDebouncedTerm("");
      return;
    }
    timerRef.current = setTimeout(() => {
      setDebouncedTerm(next);
    }, DEBOUNCE_MS);
  }, []);

  const handleValueChange = useCallback(
    (value: string, details: { reason: string }) => {
      if (details.reason === "item-press") {
        const picked = items.find((item) => item.ticker === value);
        if (picked) {
          if (onSelect) {
            onSelect(picked.ticker, picked.name);
          } else {
            router.push(`/symbol/${picked.ticker}` as Route);
          }
        }
        return;
      }
      setTerm(value);
      scheduleSearch(value);
    },
    [items, onSelect, router, scheduleSearch],
  );

  const status: StatusKind =
    trimmed.length === 0
      ? "idle"
      : trimmed.length < MIN_QUERY_LENGTH
        ? "short"
        : debouncedTerm !== trimmed || searchQuery.isFetching
          ? "loading"
          : searchQuery.isError
            ? "error"
            : items.length === 0
              ? "empty"
              : "idle";

  const statusMessages: Record<StatusKind, string | null> = {
    idle: null,
    loading: t("searching"),
    error: t("error"),
    empty: t("noResults"),
    short: t("hint"),
  };
  const statusText = statusMessages[status];

  return (
    <Autocomplete.Root<CompanySearchResult>
      items={items}
      onValueChange={handleValueChange}
      itemToStringValue={(item) => item.ticker}
      filter={null}
    >
      <Autocomplete.InputGroup
        className={cn(
          "relative flex h-11 w-full items-center rounded-md border border-border bg-surface md:h-9",
          className,
        )}
      >
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
        />
        <Autocomplete.Input
          id={id}
          aria-label={ariaLabel ?? t("label")}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid || undefined}
          placeholder={placeholder ?? t("placeholder")}
          className="h-full w-full min-w-0 rounded-md bg-transparent pr-9 pl-9 text-sm text-surface-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
        />
        <Autocomplete.Clear
          aria-label={t("clear")}
          className="absolute right-2 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-foreground"
        >
          <X aria-hidden="true" className="size-4" />
        </Autocomplete.Clear>
      </Autocomplete.InputGroup>

      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={4} align="start" className="z-50 outline-none">
          <Autocomplete.Popup
            className={cn(
              "max-h-(--available-height) w-(--anchor-width) min-w-56 overflow-hidden rounded-lg border border-border bg-surface-raised shadow-pop",
              "transition-[opacity,transform] duration-150 ease-out data-starting-style:scale-98 data-starting-style:opacity-0 data-ending-style:scale-98 data-ending-style:opacity-0",
            )}
          >
            <Autocomplete.Status className="px-3 py-2 text-xs text-muted-foreground empty:hidden">
              {statusText ? <span>{statusText}</span> : null}
            </Autocomplete.Status>
            <Autocomplete.List className="max-h-80 overflow-y-auto overscroll-contain p-1">
              {(item: CompanySearchResult) => (
                <Autocomplete.Item
                  key={item.ticker}
                  value={item}
                  className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm select-none data-highlighted:bg-surface-hover"
                >
                  <span className="shrink-0 font-mono text-foreground">{item.ticker}</span>
                  <span className="min-w-0 truncate text-muted-foreground">{item.name}</span>
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
