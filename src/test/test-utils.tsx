/**
 * Test yardımcıları.
 *
 * İstemci bileşenlerini gerçek `tr` kataloğuyla render eder; böylece testler
 * i18n anahtarlarını değil kullanıcıya görünen metni doğrular.
 */
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import messages from "../../messages/tr.json";

export function renderWithIntl(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NextIntlClientProvider locale="tr" messages={messages}>
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });
}
