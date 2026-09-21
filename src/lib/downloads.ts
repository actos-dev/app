/**
 * Masaüstü indirme manifesti (Faz 2 / Birim 2.3b, eski davranışla uyumlu).
 *
 * Masaüstü istemci DONDURULDU (WEB_REFACTOR_PLAN §0): binary'ler bu repodan
 * üretilmez, deploy sırasında `/downloads/` altına statik olarak düşer.
 * Sayfa manifesti dosya sisteminden okur; dosya yok veya bozuksa `null`
 * döner ve sayfa hata fırlatmadan sade bir "sürüm yok" durumu gösterir.
 * Tarayıcıdan erişilebilmesi için Next `public/downloads/manifest.json`
 * altında durması gerekir.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type DownloadsManifest = {
  version: string;
  files: string[];
};

export type DownloadPlatform = "windows" | "macos" | "linux";

export type DownloadGroup = {
  platform: DownloadPlatform;
  files: string[];
};

export type DownloadFileType = "installer" | "disk" | "archive" | "package" | "executable";

const PLATFORM_MATCHERS: Record<DownloadPlatform, (file: string) => boolean> = {
  windows: (file) => file.endsWith(".exe") || file.endsWith(".msi"),
  macos: (file) => file.endsWith(".dmg") || file.endsWith(".tar.gz"),
  linux: (file) =>
    file.endsWith(".AppImage") || file.endsWith(".deb") || file.endsWith(".rpm"),
};

/** Bilinmeyen/bozuk gövdeden güvenli bir manifesto daraltır. */
export function parseDownloadsManifest(value: unknown): DownloadsManifest | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const version = typeof record.version === "string" ? record.version.trim() : "";
  if (version.length === 0 || !Array.isArray(record.files)) {
    return null;
  }
  const files = record.files.filter(
    (file): file is string => typeof file === "string" && file.trim().length > 0,
  );
  return { version, files };
}

/** Dosyaları platforma göre gruplar; boş platformlar listelenmez. */
export function groupDownloads(files: string[]): DownloadGroup[] {
  return (Object.keys(PLATFORM_MATCHERS) as DownloadPlatform[])
    .map((platform) => ({ platform, files: files.filter(PLATFORM_MATCHERS[platform]) }))
    .filter((group) => group.files.length > 0);
}

/** Uzun build dosya adını kısa i18n etiket anahtarına eşler. */
export function downloadFileType(file: string): DownloadFileType {
  if (file.endsWith(".msi") || file.endsWith(".exe")) {
    return "installer";
  }
  if (file.endsWith(".dmg")) {
    return "disk";
  }
  if (file.endsWith(".tar.gz")) {
    return "archive";
  }
  if (file.endsWith(".deb") || file.endsWith(".rpm")) {
    return "package";
  }
  return "executable";
}

/** `public/downloads/manifest.json` dosyasını okur; yok/erişilemezse `null`. */
export async function readDownloadsManifest(): Promise<DownloadsManifest | null> {
  try {
    const raw = await readFile(join(process.cwd(), "public", "downloads", "manifest.json"), "utf8");
    return parseDownloadsManifest(JSON.parse(raw));
  } catch {
    return null;
  }
}
