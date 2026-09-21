"use client";

/**
 * `/kitchen-sink` bileşen ve token vitrini (Faz 1 / Birim 1.5, S-16).
 *
 * Geliştirici sayfasıdır: metinler bilinçli olarak düz İngilizce, i18n
 * anahtarı kullanılmaz. Swatch'lar yalnızca token utility'leri (`bg-*`,
 * `text-*`, `border-*`) üzerinden renklenir; tema değişince CSS değişkenleri
 * canlı güncellenir (bkz. `src/styles/tokens.css`).
 */
import { Inbox, Plus, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Panel içi kısa açıklama satırı. */
function SectionIntro({ children }: { children: ReactNode }) {
  return <p className="max-w-3xl text-sm text-muted-foreground">{children}</p>;
}

/* ------------------------------------------------------------------ */
/* 1. Renk rolleri                                                     */
/* ------------------------------------------------------------------ */

type ColorSwatch = {
  /** Token adı (mono etiket). */
  token: string;
  /** Kullanım örneği olan utility sınıfı. */
  utility: string;
  /** Önizleme kutusunun sınıfları (literal olmalı; Tailwind tarar). */
  previewClassName: string;
  /** Önizleme içindeki örnek metin. */
  sample?: string;
};

function SwatchCard({ swatch }: { swatch: ColorSwatch }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-md border border-border bg-surface-raised p-3">
      <div
        className={cn(
          "flex h-10 items-center justify-center rounded-md px-2 text-sm font-medium",
          swatch.previewClassName,
        )}
      >
        {swatch.sample ? <span className="truncate">{swatch.sample}</span> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-mono text-xs text-foreground">{swatch.token}</span>
        <span className="truncate font-mono text-xs text-muted-foreground">{swatch.utility}</span>
      </div>
    </div>
  );
}

function ColorGroup({ title, swatches }: { title: string; swatches: readonly ColorSwatch[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {swatches.map((swatch) => (
          <SwatchCard key={swatch.token} swatch={swatch} />
        ))}
      </div>
    </div>
  );
}

const surfaceSwatches: readonly ColorSwatch[] = [
  {
    token: "--background",
    utility: "bg-background",
    previewClassName: "border border-border bg-background",
  },
  {
    token: "--surface",
    utility: "bg-surface",
    previewClassName: "border border-border bg-surface",
  },
  {
    token: "--surface-raised",
    utility: "bg-surface-raised",
    previewClassName: "border border-border bg-surface-raised",
  },
  {
    token: "--surface-hover",
    utility: "bg-surface-hover",
    previewClassName: "border border-border bg-surface-hover",
  },
  {
    token: "--overlay",
    utility: "bg-overlay",
    previewClassName: "border border-border bg-overlay",
  },
];

const borderSwatches: readonly ColorSwatch[] = [
  {
    token: "--border",
    utility: "border-border",
    previewClassName: "border-2 border-border bg-surface",
  },
  {
    token: "--border-strong",
    utility: "border-border-strong",
    previewClassName: "border-2 border-border-strong bg-surface",
  },
  {
    token: "--focus-ring",
    utility: "border-focus-ring",
    previewClassName: "border-2 border-focus-ring bg-surface",
  },
];

const textSwatches: readonly ColorSwatch[] = [
  {
    token: "--foreground",
    utility: "text-foreground",
    previewClassName: "border border-border bg-surface text-foreground",
    sample: "Aa 1.234,56",
  },
  {
    token: "--muted-foreground",
    utility: "text-muted-foreground",
    previewClassName: "border border-border bg-surface text-muted-foreground",
    sample: "Aa 1.234,56",
  },
  {
    token: "--primary",
    utility: "text-primary",
    previewClassName: "border border-border bg-surface text-primary",
    sample: "Link / action",
  },
  {
    token: "--chart-text",
    utility: "text-chart-text",
    previewClassName: "border border-border bg-surface text-chart-text",
    sample: "Axis label",
  },
];

const statusSwatches: readonly ColorSwatch[] = [
  {
    token: "--primary / --primary-foreground",
    utility: "bg-primary text-primary-foreground",
    previewClassName: "bg-primary text-primary-foreground",
    sample: "Primary",
  },
  {
    token: "--accent / --accent-foreground",
    utility: "bg-accent text-accent-foreground",
    previewClassName: "bg-accent text-accent-foreground",
    sample: "Accent",
  },
  {
    token: "--positive / --positive-foreground",
    utility: "bg-positive text-positive-foreground",
    previewClassName: "bg-positive text-positive-foreground",
    sample: "+2,41% ▲",
  },
  {
    token: "--negative / --negative-foreground",
    utility: "bg-negative text-negative-foreground",
    previewClassName: "bg-negative text-negative-foreground",
    sample: "−1,18% ▼",
  },
  {
    token: "--warning / --warning-foreground",
    utility: "bg-warning text-warning-foreground",
    previewClassName: "bg-warning text-warning-foreground",
    sample: "Delayed",
  },
  {
    token: "--info / --info-foreground",
    utility: "bg-info text-info-foreground",
    previewClassName: "bg-info text-info-foreground",
    sample: "Info",
  },
];

const chartSwatches: readonly ColorSwatch[] = [
  { token: "--chart-up", utility: "bg-chart-up", previewClassName: "bg-chart-up" },
  { token: "--chart-down", utility: "bg-chart-down", previewClassName: "bg-chart-down" },
  {
    token: "--chart-grid",
    utility: "bg-chart-grid",
    previewClassName: "border border-border bg-chart-grid",
  },
];

function ColorRolesSection() {
  return (
    <Panel title="Color roles">
      <div className="flex flex-col gap-6">
        <SectionIntro>
          Semantic roles for the active theme. Switch the theme from the topbar; every swatch
          below uses live token utilities and follows the change without a reload. Text roles are
          opaque by contract — no alpha-faded text.
        </SectionIntro>
        <ColorGroup title="Surfaces" swatches={surfaceSwatches} />
        <ColorGroup title="Borders & focus" swatches={borderSwatches} />
        <ColorGroup title="Text" swatches={textSwatches} />
        <ColorGroup title="Brand & status" swatches={statusSwatches} />
        <ColorGroup title="Charts" swatches={chartSwatches} />
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Tipografi                                                        */
/* ------------------------------------------------------------------ */

const headingScale = [
  { className: "text-2xl font-semibold", spec: "24 / page title", sample: "BIST 100" },
  { className: "text-xl font-semibold", spec: "20 / section title", sample: "Portfolio summary" },
  { className: "text-base font-semibold", spec: "16 / panel heading", sample: "Open positions" },
  {
    className: "text-sm font-medium",
    spec: "14 / table cell",
    sample: "THYAO · Türk Hava Yolları",
  },
  { className: "text-xs", spec: "12 / caption & axis", sample: "Updated 10 minutes ago" },
] as const;

function TypographySection() {
  return (
    <Panel title="Typography">
      <div className="flex flex-col gap-6">
        <SectionIntro>
          Geist for UI, Geist Mono with tabular numerals for prices and ratios. The smallest
          allowed size is 12 px; smaller arbitrary text fails the token gate.
        </SectionIntro>
        <div className="flex flex-col">
          {headingScale.map((row) => (
            <div
              key={row.spec}
              className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0"
            >
              <p className={row.className}>{row.sample}</p>
              <span className="font-mono text-xs text-muted-foreground">{row.spec}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <p className="max-w-prose text-sm text-foreground">
            Body copy uses the default foreground role on the active surface. Keep paragraphs
            short and let the data carry the hierarchy.
          </p>
          <p className="max-w-prose text-sm text-muted-foreground">
            Muted copy is reserved for metadata such as timestamps, sources and helper text.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Numeric alignment
          </h3>
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-raised text-xs text-muted-foreground">
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    Symbol
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Last
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                <tr className="border-b border-border">
                  <td className="px-3 py-1.5 font-sans">THYAO</td>
                  <td className="px-3 py-1.5 text-right">312,75</td>
                  <td className="px-3 py-1.5 text-right text-positive">+2,41% ▲</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-1.5 font-sans">ASELS</td>
                  <td className="px-3 py-1.5 text-right">68,40</td>
                  <td className="px-3 py-1.5 text-right text-negative">−1,18% ▼</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 font-sans">USDTRY</td>
                  <td className="px-3 py-1.5 text-right">42,1638</td>
                  <td className="px-3 py-1.5 text-right text-positive">+0,12% ▲</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Colour is doubled with a sign and an arrow so gains and losses stay readable for
            colour-blind users.
          </p>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Butonlar                                                         */
/* ------------------------------------------------------------------ */

const buttonVariants = ["primary", "secondary", "ghost", "danger"] as const;

function ButtonsSection() {
  return (
    <Panel title="Buttons">
      <div className="flex flex-col gap-6">
        <SectionIntro>
          Four variants across four sizes. Touch targets are 44 px on mobile and compress to the
          desktop density at the `md` breakpoint.
        </SectionIntro>
        <div className="flex flex-col gap-4">
          {buttonVariants.map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-3">
              <span className="w-20 font-mono text-xs text-muted-foreground">{variant}</span>
              <Button variant={variant} size="sm">
                Small
              </Button>
              <Button variant={variant} size="md">
                Medium
              </Button>
              <Button variant={variant} size="lg">
                Large
              </Button>
              <Button variant={variant} size="icon" aria-label={`${variant} icon action`}>
                <Plus aria-hidden="true" className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-20 font-mono text-xs text-muted-foreground">disabled</span>
          <Button disabled>Disabled</Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="ghost" disabled>
            Disabled
          </Button>
          <Button variant="danger" disabled>
            Disabled
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-20 font-mono text-xs text-muted-foreground">loading</span>
          <Button loading>Generating report</Button>
          <Button variant="secondary" loading>
            Refreshing quotes
          </Button>
          <Button variant="danger" loading>
            Deleting
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Form kontrolleri                                                 */
/* ------------------------------------------------------------------ */

const periodOptions = [
  { value: "1d", label: "1 day" },
  { value: "1w", label: "1 week" },
  { value: "1m", label: "1 month" },
  { value: "1y", label: "1 year" },
] as const;

function FormControlsSection() {
  return (
    <Panel title="Form controls">
      <div className="flex flex-col gap-6">
        <SectionIntro>
          Every control is labelled, reachable with Tab and operable with the keyboard. Select,
          checkbox and switch follow the Base UI arrow/space interactions.
        </SectionIntro>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Ticker">
            {({ id, ...controlProps }) => (
              <Input id={id} placeholder="THYAO" autoComplete="off" {...controlProps} />
            )}
          </FormField>
          <FormField label="E-mail" hint="Used only for account notifications.">
            {({ id, ...controlProps }) => (
              <Input
                id={id}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...controlProps}
              />
            )}
          </FormField>
          <FormField label="Quantity" error="Quantity must be a positive integer.">
            {({ id, ...controlProps }) => (
              <Input id={id} inputMode="numeric" placeholder="0" {...controlProps} />
            )}
          </FormField>
          <FormField label="Period">
            {({ id, ...controlProps }) => (
              <Select
                id={id}
                placeholder="Select period"
                options={periodOptions}
                {...controlProps}
              />
            )}
          </FormField>
          <FormField label="Thesis note" hint="Free text; stored with the position.">
            {({ id, ...controlProps }) => (
              <Textarea id={id} placeholder="Why this position?" {...controlProps} />
            )}
          </FormField>
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-foreground">Selection</span>
            <label className="flex min-h-11 items-center gap-2 text-sm text-foreground md:min-h-0">
              <Checkbox defaultChecked />
              Notify me when price alerts fire
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-foreground md:min-h-0">
              <Checkbox indeterminate />
              Partial selection
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-foreground md:min-h-0">
              <Checkbox disabled />
              Disabled option
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-foreground md:min-h-0">
              <Switch defaultChecked />
              Daily digest at 09:30
            </label>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Gezinme ve katmanlar                                             */
/* ------------------------------------------------------------------ */

const demoTabs = [
  {
    value: "overview",
    label: "Overview",
    content: (
      <p className="text-sm text-foreground">
        Portfolio value, daily P&amp;L and benchmark delta for the selected period.
      </p>
    ),
  },
  {
    value: "positions",
    label: "Positions",
    content: (
      <p className="text-sm text-foreground">
        8 positions · 3 up · 5 down · total cost 84.320,00 TRY.
      </p>
    ),
  },
  {
    value: "trades",
    label: "Trades",
    content: (
      <p className="text-sm text-foreground">
        Last trade: BUY 25 THYAO @ 312,75 (commission 7,82 TRY).
      </p>
    ),
  },
] as const;

const demoMenuItems = [
  { label: "Account", onSelect: () => toast.info("Account selected") },
  { label: "Preferences", onSelect: () => toast.info("Preferences selected") },
  {
    label: "Sign out",
    destructive: true,
    separatorBefore: true,
    onSelect: () => toast.warning("Sign out selected"),
  },
] as const;

function NavigationSection() {
  return (
    <Panel title="Navigation & layers">
      <div className="flex flex-col gap-6">
        <SectionIntro>
          Tabs keep one pattern for the whole app; dialogs, menus and tooltips own their focus
          traps, Escape handling and arrow-key navigation.
        </SectionIntro>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Tabs
            </h3>
            <Tabs items={demoTabs} defaultValue="overview" />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Overlays
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Dialog
                trigger={<Button>Open confirm dialog</Button>}
                title="Confirm order"
                description="This places a paper trade in your virtual portfolio."
                footer={
                  <>
                    <DialogClose render={<Button variant="secondary">Cancel</Button>} />
                    <Button>Place order</Button>
                  </>
                }
              >
                <p className="text-sm text-muted-foreground">
                  BUY 25 THYAO @ 312,75 · estimated cost 7.826,57 TRY including commission.
                </p>
              </Dialog>
              <Menu trigger={<Button variant="secondary">Open menu</Button>} items={demoMenuItems} />
              <Tooltip content="Quotes refresh every 10 minutes">
                <Button variant="ghost" size="icon" aria-label="Refresh quotes">
                  <RefreshCw aria-hidden="true" className="size-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Bildirimler                                                      */
/* ------------------------------------------------------------------ */

function showLoadingToast() {
  const id = toast.loading("Generating report…");
  window.setTimeout(() => {
    toast.success("Report ready", { id });
  }, 1200);
}

function NotificationsSection() {
  return (
    <Panel title="Notifications">
      <div className="flex flex-col gap-6">
        <SectionIntro>
          Sonner toasts inherit the active theme through token variables. Badges use the same
          status pairs for inline state.
        </SectionIntro>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => toast.success("Saved", { description: "The change is live." })}
          >
            Success toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.error("Request failed", { description: "Try again shortly." })}
          >
            Error toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.warning("Market closed", { description: "Orders open at 10:00." })}
          >
            Warning toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.info("Session expires in 5 minutes")}
          >
            Info toast
          </Button>
          <Button variant="secondary" onClick={showLoadingToast}>
            Loading → success
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Badges
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Neutral</Badge>
            <Badge variant="positive">+2,41% ▲</Badge>
            <Badge variant="negative">−1,18% ▼</Badge>
            <Badge variant="warning">Market closed</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Durumlar                                                         */
/* ------------------------------------------------------------------ */

function StatesSection() {
  return (
    <Panel title="States">
      <div className="flex flex-col gap-6">
        <SectionIntro>
          Loading, empty and error states share the same surface language. Retry actions surface
          their outcome as a toast.
        </SectionIntro>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Skeleton
            </h3>
            <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-64 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Empty state
            </h3>
            <EmptyState
              icon={<Inbox aria-hidden="true" className="size-5" />}
              title="No watchlist items"
              description="Star a symbol from the markets page to follow it here."
              action={
                <Button size="sm" variant="secondary">
                  Browse markets
                </Button>
              }
            />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Error state
            </h3>
            <ErrorState
              title="Couldn't load quotes"
              description="The price service did not answer in time."
              retry={{ label: "Retry", onRetry: () => toast.error("Retry failed again") }}
            />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Panel — empty body
            </h3>
            <Panel contentClassName="p-0">
              <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
                <p className="text-sm font-medium text-foreground">No rows to display</p>
                <p className="text-xs text-muted-foreground">
                  Adjust the filters or add a new record.
                </p>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Sayfa                                                               */
/* ------------------------------------------------------------------ */

export function KitchenSinkShowcase() {
  return (
    <>
      <PageHeader
        title="Kitchen sink"
        description="Development-only gallery of semantic tokens, primitives and states. This route returns 404 in production builds."
      />
      <div className="flex flex-col gap-6">
        <ColorRolesSection />
        <TypographySection />
        <ButtonsSection />
        <FormControlsSection />
        <NavigationSection />
        <NotificationsSection />
        <StatesSection />
      </div>
    </>
  );
}
