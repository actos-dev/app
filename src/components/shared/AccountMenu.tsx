"use client";

/**
 * Topbar hesap menüsü (Faz 5 / Birim 5A.3, U-11, A-02, A-06).
 *
 * Base UI Menu primitifleri doğrudan kullanılır (radyo grupları, ayırıcılar,
 * klavye gezintisi ve `role="menu"` ARIA'sı Base UI'dan gelir). İçerik:
 * kısa kredi bakiyesi, Profil bağlantısı, tema seçimi, dil seçimi ve Çıkış.
 *
 * Tema/dil, mevcut `ThemeSwitcher`/`LocaleSwitcher` server action'larını
 * çağırır; bu bileşenler public header ve auth layout'ta yerinde kalır. Tema
 * ve dil değişimi menüyü KAPATMAZ (`closeOnClick={false}`), böylece kullanıcı
 * birden çok tercihi sırayla değiştirebilir.
 *
 * Klavye: tetikleyici `aria-label` taşır; ok tuşları/Home/End/typeahead ve
 * Escape Base UI'dan gelir. Çıkış öğesi yıkıcı olarak işaretlenir.
 */
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Check, Coins, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { isLowCredit, useCredits } from "@/hooks/useCredits";
import { useLogout } from "@/hooks/useLogout";
import { setLocale, setTheme } from "@/i18n/actions";
import { isLocale, isTheme, locales, themes, type ThemeName } from "@/i18n/config";
import { EMPTY_VALUE, useFormatters } from "@/lib/format";
import { cn } from "@/lib/utils";

type AccountMenuProps = {
  /** SSR'da çerezden çözülen aktif tema. */
  theme: ThemeName;
  /** RSC'den gelen kredi bakiyesi; yoksa istemci çeker. */
  initialCredits?: number;
};

const itemClassName =
  "flex min-h-11 cursor-default items-center gap-2 rounded-md px-2 text-sm text-foreground select-none data-highlighted:bg-surface-hover data-disabled:pointer-events-none data-disabled:opacity-50 md:min-h-8";

const groupLabelClassName =
  "px-2 pt-1.5 pb-0.5 text-xs font-medium tracking-wide text-muted-foreground uppercase";

export function AccountMenu({ theme, initialCredits }: AccountMenuProps) {
  const t = useTranslations("account");
  const localeNames = useTranslations("locale");
  const themeNames = useTranslations("theme");
  const locale = useLocale();
  const { formatPrice } = useFormatters();
  const { logout, isPending: isLoggingOut } = useLogout();
  const [isSwitching, startTransition] = useTransition();

  const creditsQuery = useCredits(
    initialCredits === undefined ? undefined : { credits: initialCredits },
  );
  const credits = creditsQuery.data?.credits;
  const low = isLowCredit(credits);

  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        render={
          <Button variant="ghost" size="icon" aria-label={t("menuLabel")}>
            <UserRound aria-hidden="true" className="size-5" />
          </Button>
        }
      />
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={6} align="end" className="z-50">
          <BaseMenu.Popup className="min-w-56 rounded-lg border border-border bg-surface-raised p-1 shadow-pop transition-[opacity,transform] duration-150 ease-out data-starting-style:scale-98 data-starting-style:opacity-0 data-ending-style:scale-98 data-ending-style:opacity-0">
            <div className="flex items-center justify-between gap-3 rounded-md px-2 py-2">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins aria-hidden="true" className="size-4" />
                {t("credits")}
              </span>
              <span
                className={cn(
                  "font-mono text-sm font-semibold tabular-nums",
                  low ? "text-warning" : "text-foreground",
                )}
              >
                {credits === undefined ? EMPTY_VALUE : formatPrice(credits, { fractionDigits: 0 })}
              </span>
            </div>

            <BaseMenu.Separator className="my-1 h-px bg-border" />

            <BaseMenu.LinkItem
              href="/profile"
              render={<Link href="/profile" />}
              className={itemClassName}
            >
              <UserRound aria-hidden="true" className="size-4" />
              {t("profile")}
            </BaseMenu.LinkItem>

            <BaseMenu.Separator className="my-1 h-px bg-border" />

            <BaseMenu.Group>
              <BaseMenu.GroupLabel className={groupLabelClassName}>
                {t("theme")}
              </BaseMenu.GroupLabel>
              <BaseMenu.RadioGroup
                value={theme}
                onValueChange={(value) => {
                  if (!isTheme(value) || isSwitching) {
                    return;
                  }
                  startTransition(() => {
                    void setTheme(value);
                  });
                }}
              >
                {themes.map((value) => (
                  <BaseMenu.RadioItem
                    key={value}
                    value={value}
                    label={themeNames(value)}
                    closeOnClick={false}
                    disabled={isSwitching}
                    className={itemClassName}
                  >
                    <span className="flex-1">{themeNames(value)}</span>
                    <BaseMenu.RadioItemIndicator className="text-primary">
                      <Check aria-hidden="true" className="size-4" />
                    </BaseMenu.RadioItemIndicator>
                  </BaseMenu.RadioItem>
                ))}
              </BaseMenu.RadioGroup>
            </BaseMenu.Group>

            <BaseMenu.Separator className="my-1 h-px bg-border" />

            <BaseMenu.Group>
              <BaseMenu.GroupLabel className={groupLabelClassName}>
                {t("language")}
              </BaseMenu.GroupLabel>
              <BaseMenu.RadioGroup
                value={locale}
                onValueChange={(value) => {
                  if (!isLocale(value) || isSwitching) {
                    return;
                  }
                  startTransition(() => {
                    void setLocale(value);
                  });
                }}
              >
                {locales.map((value) => (
                  <BaseMenu.RadioItem
                    key={value}
                    value={value}
                    label={localeNames(value)}
                    closeOnClick={false}
                    disabled={isSwitching}
                    className={itemClassName}
                  >
                    <span className="flex-1">{localeNames(value)}</span>
                    <BaseMenu.RadioItemIndicator className="text-primary">
                      <Check aria-hidden="true" className="size-4" />
                    </BaseMenu.RadioItemIndicator>
                  </BaseMenu.RadioItem>
                ))}
              </BaseMenu.RadioGroup>
            </BaseMenu.Group>

            <BaseMenu.Separator className="my-1 h-px bg-border" />

            <BaseMenu.Item
              disabled={isLoggingOut}
              onClick={() => {
                void logout();
              }}
              className={cn(itemClassName, "text-negative")}
            >
              <LogOut aria-hidden="true" className="size-4" />
              {t("logout")}
            </BaseMenu.Item>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
