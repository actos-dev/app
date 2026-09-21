"use client";

/**
 * Rapor detay görünümü (Faz 5 / Birim 5A.1, S-03, K-09).
 *
 * İçerik `ReportMarkdown` ile sanitize edilmiş markdown olarak render edilir;
 * ham HTML yolu yoktur. Meta blokları tip/token/maliyet/tarih/amaç gösterir,
 * kaynak listesi dış bağlantıları `safeExternalUrl` kapısından geçirir.
 */
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { ReportActions } from "@/components/reports/ReportActions";
import { ReportMarkdown } from "@/components/reports/ReportMarkdown";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/badge";
import { EMPTY_VALUE, useFormatters } from "@/lib/format";
import {
  isReportType,
  sentimentLabelKey,
  sentimentVariant,
} from "@/lib/reports/report";
import { safeExternalUrl } from "@/lib/safe-url";
import type { ReportDetail } from "@/lib/reports/types";

type ReportDetailViewProps = {
  report: ReportDetail;
};

function MetaItem({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-surface-raised px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function ReportDetailView({ report }: ReportDetailViewProps) {
  const t = useTranslations("reports");
  const { formatDateTime, formatPrice } = useFormatters();

  const tokens = report.token_usage?.total;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={report.title?.trim() || t("detail.titleFallback")}
        description={report.about}
        backHref="/research/reports"
        backLabel={t("detail.back")}
        actions={<ReportActions reportId={report.report_id} markdown={report.report} />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetaItem
          label={t("detail.meta.type")}
          value={
            isReportType(report.type) ? (
              <Badge variant={report.type === "deep_report" ? "info" : "neutral"}>
                {t(`type.${report.type}`)}
              </Badge>
            ) : (
              report.type
            )
          }
        />
        <MetaItem
          label={t("detail.meta.tokens")}
          value={
            tokens === null || tokens === undefined
              ? EMPTY_VALUE
              : t("detail.tokensValue", { count: formatPrice(tokens, { fractionDigits: 0 }) })
          }
        />
        <MetaItem
          label={t("detail.meta.cost")}
          value={
            report.credits_spend === null || report.credits_spend === undefined
              ? EMPTY_VALUE
              : t("detail.costValue", {
                  credits: formatPrice(report.credits_spend, { fractionDigits: 0 }),
                })
          }
        />
        <MetaItem label={t("detail.meta.date")} value={formatDateTime(report.created_at)} />
      </div>

      {report.purpose ? (
        <Panel title={t("detail.meta.purpose")}>
          <p className="text-sm whitespace-pre-wrap text-foreground">{report.purpose}</p>
        </Panel>
      ) : null}

      <Panel>
        <ReportMarkdown content={report.report} />
      </Panel>

      <Panel title={t("detail.sentiments.title")}>
        {report.sentiments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("detail.sentiments.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {report.sentiments.map((sentiment, index) => {
              const safeUrl = safeExternalUrl(sentiment.url);
              return (
                <li
                  key={`${sentiment.url ?? "source"}-${index}`}
                  className="flex flex-col gap-1.5 border-b border-border pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={sentimentVariant(sentiment.sentiment)}>
                      {t(`detail.sentiments.${sentimentLabelKey(sentiment.sentiment)}`)}
                    </Badge>
                    {safeUrl ? (
                      <a
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-full truncate text-sm text-primary hover:text-primary-hover"
                      >
                        {t("detail.sentiments.source")}
                      </a>
                    ) : null}
                  </div>
                  {sentiment.reasoning ? (
                    <p className="text-sm text-muted-foreground">{sentiment.reasoning}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
