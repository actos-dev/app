"use client";

/**
 * Görünüm sekmesi (Faz 5 / Birim 5B.2, U-11, B-15).
 *
 * Mevcut `ThemeSwitcher`/`LocaleSwitcher` çerezi server action ile yazar; bu
 * sekme ek olarak seçimi **best-effort** `PUT /user/preferences` ile hesaba
 * kaydeder (B-15). Yazma başarısız olsa da akış kesilmez: SSR tercihi her
 * hâlükârda çerezden çözer, başarıda kısa bir `role="status"` notu görünür.
 */
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Panel } from "@/components/shared/Panel";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { useSavePreferences } from "@/hooks/useProfile";
import type { ThemeName } from "@/i18n/config";

import { StatusMessage } from "./parts";

export function AppearanceTab({ theme }: { theme: ThemeName }) {
  const t = useTranslations("profile");
  const save = useSavePreferences();
  const [saved, setSaved] = useState(false);

  const remember = (prefs: Record<string, unknown>) => {
    setSaved(false);
    save.mutate(prefs, { onSuccess: () => setSaved(true) });
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel title={t("appearance.theme")}>
        <ThemeSwitcher theme={theme} onChange={(value) => remember({ theme: value })} />
      </Panel>

      <Panel title={t("appearance.language")}>
        <LocaleSwitcher onChange={(value) => remember({ locale: value })} />
      </Panel>

      <p className="text-sm text-muted-foreground">{t("appearance.description")}</p>
      {saved ? <StatusMessage kind="success">{t("appearance.saved")}</StatusMessage> : null}
    </div>
  );
}
