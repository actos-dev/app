/**
 * Public içerik sözleşmesi ve çalışma zamanı daraltma (Faz 2 / Birim 2.3b).
 *
 * Backend'in `/about`, `/contact`, `/legal` ve `/version` uçları için
 * `response_model` tanımlamadığından `src/types/generated.ts` gövdeyi `unknown`
 * olarak verir. Tip yine de tek kaynaktan (`paths[...]`) türetilir; gerçek
 * değerler sayfa render'ı çökmeden önce bu modüldeki saf ayrıştırıcılardan
 * geçirilir. Elle ikinci bir API tipi tanımlanmaz (AGENTS.md "API tipleri").
 */
import type { paths } from "@/types/generated";

/** Backend `/api/v1/about` yanıt gövdesi (generated şeması: `unknown`). */
export type AboutResponse =
  paths["/api/v1/about"]["get"]["responses"][200]["content"]["application/json"];

/** Backend `/api/v1/contact` yanıt gövdesi (generated şeması: `unknown`). */
export type ContactResponse =
  paths["/api/v1/contact"]["get"]["responses"][200]["content"]["application/json"];

/** Backend `/api/v1/legal` yanıt gövdesi (generated şeması: `unknown`). */
export type LegalResponse =
  paths["/api/v1/legal"]["get"]["responses"][200]["content"]["application/json"];

/** Backend `/api/v1/version` yanıt gövdesi (generated şeması: `unknown`). */
export type VersionResponse =
  paths["/api/v1/version"]["get"]["responses"][200]["content"]["application/json"];

/**
 * Backend `src/api/legal.py::POLICIES` anahtarları. `GET /legal` bir liste
 * döndürmez, `GET /legal/all` ise auth ister; bu yüzden allowlist koddan elle
 * senkronlanır. Yeni bir policy eklenirse backend ile birlikte güncellenir.
 */
export const LEGAL_POLICIES = ["terms", "privacy_policy", "cookie_policy", "disclaimer"] as const;

export type LegalPolicy = (typeof LEGAL_POLICIES)[number];

/** Bilinmeyen policy slug'ı `notFound()` ile karşılanır (keyfi anahtar yok). */
export function isLegalPolicy(value: string): value is LegalPolicy {
  return (LEGAL_POLICIES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** String olmayan, boş ve yalnız boşluktan oluşan değerlerde `null` döner. */
function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Düz metni boş satır sınırlarından paragraflara böler. */
export function splitParagraphs(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.split("\n").map((line) => line.trim()).join(" ").trim())
    .filter((paragraph) => paragraph.length > 0);
}

/** Uzun yasal metnin okunabilir blokları. */
export type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

/**
 * Yasal metni boş satır sınırlarına göre bloklara ayırır; tüm satırları
 * `* ` ile başlayan bloklar madde listesi olur. Bağımlılık eklemeden
 * (markdown kütüphanesi yok) okunur bir düzen sağlar.
 */
export function splitLegalContent(content: string): LegalBlock[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) {
    return [];
  }

  return normalized
    .split(/\n{2,}/)
    .map((rawBlock) =>
      rawBlock
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    )
    .filter((lines) => lines.length > 0)
    .map((lines): LegalBlock => {
      if (lines.every((line) => line.startsWith("* "))) {
        return { type: "list", items: lines.map((line) => line.slice(2).trim()) };
      }
      return { type: "paragraph", text: lines.join(" ") };
    });
}

export type AboutContent = {
  lang: string | null;
  paragraphs: string[];
};

export function parseAboutResponse(value: unknown): AboutContent | null {
  if (!isRecord(value)) {
    return null;
  }
  return {
    lang: readString(value.lang),
    paragraphs: splitParagraphs(readString(value.content) ?? ""),
  };
}

export type ContactContent = {
  email: string | null;
  github: string | null;
};

/** `github` burada ham bırakılır; `href` öncesi `safeExternalUrl`'den geçer. */
export function parseContactResponse(value: unknown): ContactContent | null {
  if (!isRecord(value)) {
    return null;
  }
  return {
    email: readString(value.email),
    github: readString(value.github),
  };
}

export type LegalContent = {
  policy: string | null;
  lang: string | null;
  lastUpdated: string | null;
  blocks: LegalBlock[];
};

export function parseLegalResponse(value: unknown): LegalContent | null {
  if (!isRecord(value)) {
    return null;
  }
  return {
    policy: readString(value.policy),
    lang: readString(value.lang),
    lastUpdated: readString(value.last_updated),
    blocks: splitLegalContent(readString(value.content) ?? ""),
  };
}

export function parseVersionResponse(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }
  return readString(value.version);
}
