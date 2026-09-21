/**
 * Rapor indirme yardımcısı (Faz 5 / Birim 5A.1).
 *
 * `POST /reports/download` dosya gövdesi döner (markdown). İstemci `apiFetch`
 * her yanıtı JSON/`text` olarak çözdüğünden burada BFF'ye doğrudan same-origin
 * istek atılır; çerezler platform tarafından eklenir, `Origin` aynı köken
 * olduğundan BFF CSRF kapısı geçer. İndirilen içerik tarayıcıda blob'a çevrilir.
 */
const DOWNLOAD_PATH = "/api/v1/reports/download";

/** `Content-Disposition` başlığından dosya adını çıkarır; yoksa `null`. */
function parseFilename(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1]?.trim() || null;
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
 * Raporu markdown olarak indirir. `2xx` dışı yanıtta hata fırlatır; çağıran
 * taraf toast ile bildirir.
 */
export async function downloadReportMarkdown(reportId: number): Promise<void> {
  const response = await fetch(`${DOWNLOAD_PATH}?report_id=${reportId}&ftype=md`, {
    method: "POST",
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new Error("report_download_failed");
  }
  const content = await response.text();
  const filename = parseFilename(response.headers.get("content-disposition")) ?? `report_${reportId}.md`;
  triggerBrowserDownload(new Blob([content], { type: "text/markdown;charset=utf-8" }), filename);
}
