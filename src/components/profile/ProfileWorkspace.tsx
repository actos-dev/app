"use client";

/**
 * Profil sekmeleri (Faz 5 / Birim 5B.2, U-11, S-07, B-15).
 *
 * Sunucu bileşeni profili ve avatar listesini RSC'de çeker; bu istemci
 * sarmalayıcı yalnız Base UI `Tabs` ile Hesap / Görünüm / Güvenlik
 * panellerini sunar. `keepMounted={false}` sayesinde yalnız aktif sekme
 * DOM'da kalır; hesap formuyla güvenlik formu aynı anda erişilebilirlik
 * ağacına girmez (testlerde etiket çakışması olmaz).
 */
import { useTranslations } from "next-intl";

import { Tabs, type TabItem } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/useProfile";
import type { ThemeName } from "@/i18n/config";
import type { AvatarOption, Profile } from "@/lib/profile/types";

import { AccountTab } from "./AccountTab";
import { AppearanceTab } from "./AppearanceTab";
import { SecurityTab } from "./SecurityTab";

type ProfileWorkspaceProps = {
  profile: Profile;
  avatars: readonly AvatarOption[];
  /** SSR'da çerezden çözülen aktif tema. */
  theme: ThemeName;
};

export function ProfileWorkspace({ profile, avatars, theme }: ProfileWorkspaceProps) {
  const t = useTranslations("profile");
  // Tek canlı kaynak: mutasyonlar query önbelleğini günceller, sekmeler bu
  // güncel profili alır (ör. kullanıcı adı değişince güvenlik onayı da tazelenir).
  const query = useProfile(profile);
  const current = query.data ?? profile;

  const items: TabItem[] = [
    {
      value: "account",
      label: t("tabs.account"),
      content: <AccountTab profile={current} avatars={avatars} />,
    },
    {
      value: "appearance",
      label: t("tabs.appearance"),
      content: <AppearanceTab theme={theme} />,
    },
    {
      value: "security",
      label: t("tabs.security"),
      content: <SecurityTab username={current.username} />,
    },
  ];

  return <Tabs items={items} defaultValue="account" keepMounted={false} />;
}
