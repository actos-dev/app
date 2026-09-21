"use client";

/**
 * Sembol arama (Faz 3 / Birim 3.2, A-02, U-10 temeli).
 *
 * Base UI Autocomplete kullanılır: `role="combobox"`, `aria-expanded`,
 * `aria-controls`, `aria-activedescendant`, ok tuşları, Enter ile seçim,
 * Escape ile kapatma ve dışarı tıklama davranışı Base UI'dan gelir. Sorgu
 * sunucu tarafında (`/companies/search`) yapılır: en az 2 karakter, 250 ms
 * debounce ve kısa ömürlü istemci önbelleği (stale cache) ile.
 *
 * Sonuç durumu (`results` + `status`) React state'te tutulmaz; Base UI
 * `items`'ı doğrudan DOM listesinden okur. Bu yüzden yüklenme/hata/boş
 * bilgisi popup içindeki bir "durum" düğümüne yazılır (ref ile): effect
 * içinde senkron `setState` yok, gereksiz render turu yok.
 *
 * NOT: `qk` fabrikasında arama anahtarı yok; P-03'e uyum için anahtar
 * uydurmak yerine bu bileşen bilinçli olarak React Query kullanmaz ve
 * yanıtları modül düzeyi TTL önbelleğinde tutar (bkz. rapor).
 */
import { Autocomplete } from "@base-ui/react/autocomplete";
import { Search, X } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { CompanySearchResult } from "@/types/market";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;
const CACHE_TTL_MS = 60_000;

type CacheEntry = { at: number; results: CompanySearchResult[] };
const searchCache = new Map<string, CacheEntry>();

function readCache(key: string): CompanySearchResult[] | null {
  const entry = searchCache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  return entry.results;
}

function writeCache(key: string, results: CompanySearchResult[]): void {
  searchCache.set(key, { at: Date.now(), results });
}

type StatusKind = "idle" | "loading" | "error" | "empty" | "short";

type SymbolSearchProps = {
  className?: string;
};

export function SymbolSearch({ className }: SymbolSearchProps) {
  const t = useTranslations("markets.search");
  const router = useRouter();

  const [items, setItems] = useState<CompanySearchResult[]>([]);
  const [status, setStatus] = useState<StatusKind>("idle");
  const queryRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);

  const statusMessages: Record<StatusKind, string | null> = {
    idle: null,
    loading: t("searching"),
    error: t("error"),
    empty: t("noResults"),
    short: t("hint"),
  };
  const statusText = statusMessages[status];

  const publishStatus = useCallback((next: StatusKind) => {
    setStatus(next);
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      const term = value.trim();
      if (term.length < MIN_QUERY_LENGTH) {
        setItems([]);
        publishStatus(term.length === 0 ? "idle" : "short");
        return;
      }

      const cached = readCache(term);
      if (cached) {
        setItems(cached);
        publishStatus(cached.length === 0 ? "empty" : "idle");
        return;
      }

      publishStatus("loading");
      setItems([]);
    },
    [publishStatus],
  );

  // Debounce: zamanlayıcı ve istek bir kez kurulur, unmount'ta iptal edilir.
  // Ardışık yazımlarda `handleChange` her karakterde `loading` yazar; effect
  // yalnız debounce süresi dolduğunda isteği atar.
  useEffect(() => {
    if (status !== "loading") {
      return;
    }
    const timer = setTimeout(async () => {
      const term = queryRef.current.trim();
      if (term.length < MIN_QUERY_LENGTH) {
        return;
      }
      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;
      try {
        const data = await apiFetch<CompanySearchResult[]>("/api/v1/companies/search", {
          query: { query: term },
          signal: controller.signal,
        });
        if (controller.signal.aborted) {
          return;
        }
        writeCache(term, data);
        setItems(data);
        publishStatus(data.length === 0 ? "empty" : "idle");
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        setItems([]);
        publishStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [status, publishStatus]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleValueChange = useCallback(
    (value: string, details: { reason: string }) => {
      if (details.reason === "item-press") {
        const picked = items.find((item) => item.ticker === value);
        if (picked) {
          router.push(`/symbol/${picked.ticker}` as Route);
        }
        return;
      }
      queryRef.current = value;
      handleChange(value);
    },
    [items, router, handleChange],
  );

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
          aria-label={t("label")}
          placeholder={t("placeholder")}
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
