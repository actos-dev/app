/**
 * Uygulama navigasyon haritası (plan §4: Piyasa / Portföy / Araştırma / Hesap).
 *
 * Tek kaynak burasıdır: `Sidebar` ve `MobileNav` aynı listeyi tüketir. `href`
 * değerleri `typedRoutes` ile derleme zamanında var olan rotalara bağlanır;
 * `labelKey` ise `nav` i18n namespace'indeki anahtardır (`nav.dashboard`).
 */
import {
  BarChart3,
  Briefcase,
  Compass,
  Database,
  FileText,
  LayoutDashboard,
  Newspaper,
  Star,
  TrendingUp,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";

/** `nav` namespace'indeki sayfa başlığı anahtarları. */
export type NavLabelKey =
  | "dashboard"
  | "markets"
  | "watchlist"
  | "portfolio"
  | "reports"
  | "simulation"
  | "advisor"
  | "digest"
  | "data"
  | "profile"
  | "kitchenSink";

/** `nav.groups` altındaki grup adı anahtarları. */
export type NavGroupKey = "market" | "portfolio" | "research" | "account";

export type NavItem = {
  href: Route;
  labelKey: NavLabelKey;
  icon: LucideIcon;
  /** Alt rotalarda da aktif sayılmasın (yalnızca tam eşleşme). */
  exact?: boolean;
  /** Yalnızca geliştirme ortamında gösterilir (ör. bileşen kataloğu). */
  devOnly?: boolean;
};

export type NavGroup = {
  id: NavGroupKey;
  items: readonly NavItem[];
};

/** Gruplardan önce gelen tekil giriş (komuta merkezi). */
export const primaryNavItem: NavItem = {
  href: "/dashboard",
  labelKey: "dashboard",
  icon: LayoutDashboard,
  exact: true,
};

export const navGroups: readonly NavGroup[] = [
  {
    id: "market",
    items: [
      { href: "/markets", labelKey: "markets", icon: TrendingUp },
      { href: "/watchlist", labelKey: "watchlist", icon: Star },
    ],
  },
  {
    id: "portfolio",
    items: [{ href: "/portfolio", labelKey: "portfolio", icon: Briefcase }],
  },
  {
    id: "research",
    items: [
      { href: "/research/reports", labelKey: "reports", icon: FileText },
      { href: "/research/simulation", labelKey: "simulation", icon: BarChart3 },
      { href: "/research/advisor", labelKey: "advisor", icon: Compass },
      { href: "/digest", labelKey: "digest", icon: Newspaper },
    ],
  },
  {
    id: "account",
    items: [
      { href: "/data", labelKey: "data", icon: Database },
      { href: "/profile", labelKey: "profile", icon: UserRound },
      { href: "/kitchen-sink", labelKey: "kitchenSink", icon: Wrench, devOnly: true },
    ],
  },
];
