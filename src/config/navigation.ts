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
  /**
   * Kişisel rota (5C / X-03): anonimde kilitli görünür ve `/login?next=`
   * hedefine gider. Piyasa okuma rotaları (`/markets`, `/dashboard`, `/digest`)
   * herkese açıktır.
   */
  personal?: boolean;
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
      { href: "/watchlist", labelKey: "watchlist", icon: Star, personal: true },
    ],
  },
  {
    id: "portfolio",
    items: [{ href: "/portfolio", labelKey: "portfolio", icon: Briefcase, personal: true }],
  },
  {
    id: "research",
    items: [
      { href: "/research/reports", labelKey: "reports", icon: FileText, personal: true },
      { href: "/research/simulation", labelKey: "simulation", icon: BarChart3, personal: true },
      { href: "/research/advisor", labelKey: "advisor", icon: Compass, personal: true },
      { href: "/digest", labelKey: "digest", icon: Newspaper },
    ],
  },
  {
    id: "account",
    items: [
      { href: "/data", labelKey: "data", icon: Database, personal: true },
      { href: "/profile", labelKey: "profile", icon: UserRound, personal: true },
      {
        href: "/kitchen-sink",
        labelKey: "kitchenSink",
        icon: Wrench,
        devOnly: true,
        personal: true,
      },
    ],
  },
];
