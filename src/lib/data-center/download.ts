/**
 * Veri merkezi dosya indirme yardımcısı (Faz 5 / Birim 5B.3).
 *
 * `GET /data/export/download/{token}` gzip ikili gövde döner; bu yüzden
 * JSON çözen `apiFetch` kullanılamaz. BFF'ye doğrudan same-origin istek
 * atılır (çerezler platform tarafından eklenir), içerik blob'a çevrilip
 * tarayıcıya indirtilir. Dosya adı backend `Content-Disposition` başlığından
 * gelir; yol ayracı/kontrol karakterleri temizlenir (güvenli indirme).
 */
import { exportDownloadPath } from "@/lib/data-center/api-paths";
import type { ExportJob } from "@/lib/data-center/types";

const DOWNLOAD_PREFIX = "/api/v1/data/export/download/";

/** Token yalnız `token_urlsafe` karakterlerini taşır (savunma amaçlı). */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;

/** `Content-Disposition` başlığından dosya adını çıkarır; yoksa `null`. */
function parseFilename(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1]?.trim() || null;
}

/**
 * İndirilecek dosya adını güvenli hale getirir.
 *
 * Yol ayraçları ve kontrol karakterleri temizlenir, ad uzunluğu sınırlanır;
 * temizleme sonrası boş kalırsa `fallback` döner. Böylece `../` veya mutlak
 * yol içeren bir başlık tarayıcıda dizin aşımına yol açamaz.
 */
export function safeFilename(name: string | null, fallback: string): string {
  const basename = (name ?? "").split(/[/\\]/).pop() ?? "";
  const cleaned = basename.replace(/[\u0000-\u001f\u007f]+/g, "_").trim();
  if (cleaned.length === 0 || cleaned === "." || cleaned === "..") {
    return fallback;
  }
  return cleaned.slice(0, 120);
}

/** Export yanıtındaki `download_url`'den güvenli token'ı çıkarır. */
export function extractDownloadToken(downloadUrl: string | null): string | null {
  if (!downloadUrl || !downloadUrl.startsWith(DOWNLOAD_PREFIX)) {
    return null;
  }
  const raw = downloadUrl.slice(DOWNLOAD_PREFIX.length);
  let token: string;
  try {
    token = decodeURIComponent(raw);
  } catch {
    return null;
  }
  return TOKEN_PATTERN.test(token) ? token : null;
}

/** Blob'u tarayıcıya indirtir (geçici nesne URL'i hemen serbest bırakılır). */
function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Hazır bir export dosyasını indirir. `2xx` dışı yanıtta hata fırlatır;
 * çağıran taraf toast ile bildirir.
 */
export async function downloadExportFile(job: ExportJob): Promise<void> {
  const token = extractDownloadToken(job.download_url);
  if (!token) {
    throw new Error("export_not_downloadable");
  }
  const response = await fetch(exportDownloadPath(token), {
    method: "GET",
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new Error(`export_download_failed:${response.status}`);
  }
  const fallback = `florence-daily-${job.year}.${job.format}.gz`;
  const filename = safeFilename(parseFilename(response.headers.get("content-disposition")), fallback);
  const blob = await response.blob();
  triggerBrowserDownload(blob, filename);
}
