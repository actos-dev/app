/**
 * Public alt bilgi (plan §4).
 *
 * Yasal bağlantılar `/legal/[policy]` rotasına gider; sürüm bilgisi backend
 * `GET /api/v1/version` ucundan sunucuda (opsiyonel) okunur. Backend erişilemezse
 * sürüm satırı çizilmez, sayfa yine de render edilir.
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { serverApiFetch } from "@/lib/api/server";
import { parseVersionResponse, type VersionResponse } from "@/lib/public-content";

const LEGAL_LINKS = [
  { href: "/legal/terms", labelKey: "footer.terms" },
  { href: "/legal/privacy_policy", labelKey: "footer.privacy" },
  { href: "/legal/cookie_policy", labelKey: "footer.cookies" },
  { href: "/legal/disclaimer", labelKey: "footer.disclaimer" },
] as const;

export async function PublicFooter() {
  const [t, common, versionResponse] = await Promise.all([
    getTranslations("public"),
    getTranslations("common"),
    serverApiFetch<VersionResponse>("/api/v1/version", { revalidate: 3600 }),
  ]);
  const version = parseVersionResponse(versionResponse);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">{t("footer.brand")}</span>
            <span className="max-w-prose text-xs text-muted-foreground">{t("footer.tagline")}</span>
          </div>
          <nav aria-label={common("mainNavigation")} className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">{t("footer.legalTitle")}</span>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex flex-col gap-1 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {t("footer.brand")}. {t("footer.rights")}
          </span>
          {version ? <span className="tabular-nums">{t("footer.version", { version })}</span> : null}
        </div>
      </div>
    </footer>
  );
}
