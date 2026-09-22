"use client";

/**
 * Komut paleti (Faz 5 / Birim 5B.4, U-10, A-02, A-06).
 *
 * ⌘K / Ctrl+K ile açılır, Escape ile kapanır. Base UI Dialog erişilebilir
 * diyalog kabuğunu (odak tuzağı, dışa tıklama, kapanışta odağın tetikleyiciye
 * dönmesi) sağlar; içindeki liste bilinçli olarak custom bir listbox'tır:
 * odak arama alanında kalır ve `aria-activedescendant` aktif seçeneği işaret
 * eder (WAI-ARIA combobox deseni). Ok tuşları, Home/End ve Enter elle yönetilir.
 *
 * Kaynaklar gruplanmıştır: navigasyon haritasından sayfalar, uygulama
 * işlemleri (tema/dil/rapor/simülasyon/çıkış) ve `qk.companySearch(query)` ile
 * sunucudan aranan BIST sembolleri. Sayfa/işlem filtrelemesi istemcide, sembol
 * araması en az 2 karakterde 250 ms debounce ile sunucuda yapılır.
 */
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  FileText,
  Languages,
  LogOut,
  Moon,
  Search,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { navGroups, primaryNavItem, type NavItem } from "@/config/navigation";
import { useLogout } from "@/hooks/useLogout";
import { setLocale, setTheme } from "@/i18n/actions";
import { locales, themes, type ThemeName } from "@/i18n/config";
import { apiFetch } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import { cn } from "@/lib/utils";
import type { CompanySearchResult } from "@/types/market";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;
const SEARCH_STALE_MS = 60_000;

type CommandGroupId =
  | "general"
  | "market"
  | "portfolio"
  | "research"
  | "account"
  | "actions"
  | "symbols";

type CommandItem = {
  id: string;
  group: CommandGroupId;
  label: string;
  /** Sağda gösterilen yardımcı metin (ör. sembol adı). */
  hint?: string;
  icon?: LucideIcon;
  run: () => void;
};

type CommandGroup = {
  id: CommandGroupId;
  label: string;
  items: CommandItem[];
};

const THEME_ICONS: Record<ThemeName, LucideIcon> = {
  dark: Moon,
  light: Sun,
  sepia: BookOpen,
};

const LISTBOX_ID = "command-listbox";

function optionId(index: number): string {
  return `command-option-${index}`;
}

type CommandPaletteProps = {
  /** SSR'da çerezden çözülen aktif tema; işlem etiketlerinde kullanılır. */
  theme: ThemeName;
  /**
   * Oturum durumu (5C / X-03). Anonimde çıkış/rapor/simülasyon gibi kişisel
   * işlemler listeden çıkarılır; sembol arama (public) ve tema/dil kalır.
   * Varsayılan `true` eski kullanımı (testler) korur.
   */
  authenticated?: boolean;
};

export function CommandPalette({ theme, authenticated = true }: CommandPaletteProps) {
  const t = useTranslations("command");
  const tNav = useTranslations("nav");
  const themeNames = useTranslations("theme");
  const localeNames = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const { logout } = useLogout();

  const trimmed = query.trim();
  const normalizedQuery = trimmed.toLocaleLowerCase("tr");

  const searchQuery = useQuery({
    queryKey: qk.companySearch(debouncedTerm),
    queryFn: ({ signal }) =>
      apiFetch<CompanySearchResult[]>("/api/v1/companies/search", {
        query: { query: debouncedTerm },
        signal,
      }),
    enabled: open && debouncedTerm.length >= MIN_QUERY_LENGTH,
    staleTime: SEARCH_STALE_MS,
  });

  // Her açılışta sorgu/aktif indeks sıfırlanır; tetikleyici ve kısayol aynı
  // yolu kullanır. Odak Base UI `initialFocus` ile arama alanına gider.
  const openPalette = useCallback(() => {
    setQuery("");
    setDebouncedTerm("");
    setActiveIndex(0);
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setQuery("");
        setDebouncedTerm("");
        setActiveIndex(0);
      }
      setOpen(next);
    },
    [],
  );

  // Kısayol: ⌘K / Ctrl+K aç/kapat.
  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          setOpen(false);
        } else {
          openPalette();
        }
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [open, openPalette]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

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

  const pageCommands = useMemo<CommandItem[]>(() => {
    const result: CommandItem[] = [];
    const push = (navItem: NavItem, group: CommandGroupId) => {
      if (navItem.devOnly && process.env.NODE_ENV === "production") {
        return;
      }
      result.push({
        id: `page:${navItem.href}`,
        group,
        label: tNav(navItem.labelKey),
        run: () => {
          setOpen(false);
          router.push(navItem.href);
        },
      });
    };
    push(primaryNavItem, "general");
    for (const group of navGroups) {
      for (const item of group.items) {
        push(item, group.id);
      }
    }
    return result;
  }, [router, tNav]);

  const actionCommands = useMemo<CommandItem[]>(() => {
    const result: CommandItem[] = [];
    for (const value of themes) {
      result.push({
        id: `action:theme:${value}`,
        group: "actions",
        label: t("actions.theme", { theme: themeNames(value) }),
        icon: THEME_ICONS[value],
        run: () => {
          setOpen(false);
          if (value !== theme) {
            void setTheme(value);
          }
        },
      });
    }
    for (const value of locales) {
      result.push({
        id: `action:locale:${value}`,
        group: "actions",
        label: t("actions.locale", { locale: localeNames(value) }),
        icon: Languages,
        run: () => {
          setOpen(false);
          if (value !== locale) {
            void setLocale(value);
          }
        },
      });
    }
    if (authenticated) {
      result.push({
        id: "action:new-report",
        group: "actions",
        label: t("actions.newReport"),
        icon: FileText,
        run: () => {
          setOpen(false);
          router.push("/research/reports");
        },
      });
      result.push({
        id: "action:new-simulation",
        group: "actions",
        label: t("actions.newSimulation"),
        icon: BarChart3,
        run: () => {
          setOpen(false);
          router.push("/research/simulation");
        },
      });
      result.push({
        id: "action:logout",
        group: "actions",
        label: t("actions.logout"),
        icon: LogOut,
        run: () => {
          setOpen(false);
          void logout();
        },
      });
    }
    return result;
  }, [t, themeNames, localeNames, theme, locale, router, logout, authenticated]);

  const symbolCommands = useMemo<CommandItem[]>(() => {
    return (searchQuery.data ?? []).map((result) => ({
      id: `symbol:${result.ticker}`,
      group: "symbols",
      label: result.ticker,
      hint: result.name,
      run: () => {
        setOpen(false);
        router.push(`/symbol/${result.ticker}` as Route);
      },
    }));
  }, [searchQuery.data, router]);

  const groupLabel = useCallback(
    (id: CommandGroupId): string => {
      if (id === "general" || id === "actions" || id === "symbols") {
        return t(`groups.${id}`);
      }
      return tNav(`groups.${id}`);
    },
    [t, tNav],
  );

  const matches = useCallback(
    (label: string) =>
      normalizedQuery.length === 0 || label.toLocaleLowerCase("tr").includes(normalizedQuery),
    [normalizedQuery],
  );

  const groups = useMemo<CommandGroup[]>(() => {
    const order: CommandGroupId[] = [
      "general",
      "market",
      "portfolio",
      "research",
      "account",
      "actions",
      "symbols",
    ];
    const staticItems = [...pageCommands, ...actionCommands];
    const result: CommandGroup[] = [];
    for (const id of order) {
      if (id === "symbols") {
        if (normalizedQuery.length >= MIN_QUERY_LENGTH) {
          result.push({ id, label: groupLabel(id), items: symbolCommands });
        }
        continue;
      }
      const items = staticItems.filter((item) => item.group === id && matches(item.label));
      if (items.length > 0) {
        result.push({ id, label: groupLabel(id), items });
      }
    }
    return result;
  }, [pageCommands, actionCommands, symbolCommands, normalizedQuery, matches, groupLabel]);

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    flat.forEach((item, index) => map.set(item.id, index));
    return map;
  }, [flat]);

  // Filtre listeyi küçültünce aktif indeks aralık dışında kalabilir; efektle
  // state yazmak yerine okuma anında güvenli aralığa sıkıştırılır.
  const safeActiveIndex = flat.length === 0 ? 0 : Math.min(activeIndex, flat.length - 1);
  const activeItem = flat[safeActiveIndex] ?? null;
  const activeDescendant = activeItem ? optionId(safeActiveIndex) : undefined;

  // Aktif seçeneği görünür alanda tut.
  useEffect(() => {
    if (!activeDescendant) {
      return;
    }
    const element = document.getElementById(activeDescendant);
    if (element && typeof element.scrollIntoView === "function") {
      element.scrollIntoView({ block: "nearest" });
    }
  }, [activeDescendant]);

  const symbolLoading =
    normalizedQuery.length >= MIN_QUERY_LENGTH &&
    (debouncedTerm !== trimmed || searchQuery.isFetching);

  let statusText: string | null = null;
  if (normalizedQuery.length >= MIN_QUERY_LENGTH && searchQuery.isError) {
    statusText = t("error");
  } else if (symbolLoading) {
    statusText = t("searching");
  } else if (flat.length === 0 && normalizedQuery.length > 0) {
    statusText = normalizedQuery.length < MIN_QUERY_LENGTH ? t("hint") : t("empty");
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (flat.length > 0) {
        setActiveIndex((current) => (current + 1) % flat.length);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (flat.length > 0) {
        setActiveIndex((current) => (current - 1 + flat.length) % flat.length);
      }
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      if (flat.length > 0) {
        setActiveIndex(flat.length - 1);
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      activeItem?.run();
    }
  }

  return (
    <BaseDialog.Root open={open} onOpenChange={handleOpenChange}>
      <BaseDialog.Trigger
        render={
          <Button
            variant="secondary"
            size="sm"
            aria-label={t("open")}
            aria-keyshortcuts="Meta+K Control+K"
            title={t("shortcutHint")}
          >
            <Search aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">{t("placeholder")}</span>
            <kbd className="ml-1 hidden rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-xs text-muted-foreground sm:inline">
              {t("shortcut")}
            </kbd>
          </Button>
        }
      />
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-overlay transition-opacity duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <BaseDialog.Popup
          initialFocus={inputRef}
          className="fixed top-24 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-border bg-surface-raised shadow-pop transition-[opacity,transform] duration-150 ease-out data-starting-style:scale-98 data-starting-style:opacity-0 data-ending-style:scale-98 data-ending-style:opacity-0"
        >
          <BaseDialog.Title className="sr-only">{t("title")}</BaseDialog.Title>
          <BaseDialog.Description className="sr-only">{t("description")}</BaseDialog.Description>

          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={true}
              aria-controls={LISTBOX_ID}
              aria-autocomplete="list"
              aria-activedescendant={activeDescendant}
              aria-label={t("placeholder")}
              placeholder={t("placeholder")}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                scheduleSearch(event.target.value);
              }}
              onKeyDown={handleKeyDown}
              className="h-11 w-full min-w-0 bg-transparent text-sm text-surface-foreground placeholder:text-muted-foreground focus-visible:outline-none"
            />
          </div>

          <div
            id={LISTBOX_ID}
            role="listbox"
            aria-label={t("label")}
            className="max-h-80 overflow-y-auto overscroll-contain p-1"
          >
            {groups.map((group) => (
              <div key={group.id} role="group" aria-label={group.label}>
                <div
                  role="presentation"
                  className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const index = indexById.get(item.id) ?? 0;
                  const active = index === safeActiveIndex;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      id={optionId(index)}
                      role="option"
                      aria-selected={active}
                      className={cn(
                        "flex min-h-11 cursor-default items-center gap-2 rounded-md px-2 text-sm text-foreground select-none md:min-h-8",
                        active && "bg-surface-hover",
                      )}
                      onMouseMove={() => setActiveIndex(index)}
                      onClick={() => item.run()}
                    >
                      {Icon ? (
                        <Icon
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted-foreground"
                        />
                      ) : null}
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.hint ? (
                        <span className="min-w-0 shrink truncate text-xs text-muted-foreground">
                          {item.hint}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div
            role="status"
            aria-live="polite"
            className="border-t border-border px-3 py-2 text-xs text-muted-foreground empty:hidden"
          >
            {statusText ? <span>{statusText}</span> : null}
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
