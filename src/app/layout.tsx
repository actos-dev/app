import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

export const metadata: Metadata = {
  title: "Florence",
  description: "BIST market tracking and paper portfolio simulator.",
};

/** Tema değişimi birim 1.5'te gelir; şimdilik varsayılan koyu tema sabittir. */
export const viewport: Viewport = {
  themeColor: "#0b0e14",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      data-theme="dark"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
