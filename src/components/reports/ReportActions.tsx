"use client";

/**
 * Rapor detay aksiyonları (Faz 5 / Birim 5A.1).
 *
 * Kopyala panoya yazar; indir backend `POST /reports/download` üzerinden
 * markdown dosyası üretir. İkisi de başarısızlıkta sessizce düşmez, toast ile
 * geri bildirir (metinler i18n'den).
 */
import { Check, Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadReportMarkdown } from "@/lib/reports/download";

type ReportActionsProps = {
  reportId: number;
  /** Panoya yazılacak tam rapor metni (markdown). */
  markdown: string;
};

export function ReportActions({ reportId, markdown }: ReportActionsProps) {
  const t = useTranslations("reports");
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success(t("detail.actions.copied"));
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("detail.actions.copyFailed"));
    }
  };

  const handleDownload = async () => {
    try {
      await downloadReportMarkdown(reportId);
    } catch {
      toast.error(t("detail.actions.downloadFailed"));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
        {copied ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
        {t("detail.actions.copy")}
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={handleDownload}>
        <Download aria-hidden="true" className="size-4" />
        {t("detail.actions.download")}
      </Button>
    </div>
  );
}
