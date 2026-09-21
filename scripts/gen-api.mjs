#!/usr/bin/env node
/**
 * OpenAPI sözleşmesini backend'den döker, `openapi.json` olarak yazar ve
 * `src/types/generated.ts` tip dosyasını üretir.
 *
 * Kaynak seçimi:
 *   1. OPENAPI_URL tanımlıysa oradan fetch edilir (prod/CI senaryosu).
 *   2. Aksi halde ../backend'deki .venv ile `app.openapi()` çağrılır (yerel geliştirme).
 *
 * Bu script'in çıktıları (openapi.json + src/types/generated.ts) commit edilir;
 * CI'daki drift kontrolü aynı komutu çalıştırıp `git diff --exit-code` bekler.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import openapiTS, { astToString } from "openapi-typescript";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BACKEND_DIR = resolve(ROOT, "..", "backend");
const OPENAPI_PATH = join(ROOT, "openapi.json");
const TYPES_PATH = join(ROOT, "src", "types", "generated.ts");

const PYTHON_APP_DUMP =
  'import json,sys; from src.main import app; sys.stdout.write(json.dumps(app.openapi(), ensure_ascii=False, indent=2))';

/** Hata mesajını Türkçe yazıp süreci 1 koduyla sonlandırır. */
function fail(message) {
  console.error(`\n[gen:api] HATA: ${message}\n`);
  process.exit(1);
}

/** Gelen metni JSON olarak doğrular; bozuksa örnek parçayla birlikte hata verir. */
function parseSpec(raw, source) {
  try {
    const spec = JSON.parse(raw);
    if (!spec || typeof spec !== "object" || typeof spec.paths !== "object") {
      fail(`${source} geçerli bir OpenAPI dokümanı değil ("paths" alanı yok).`);
    }
    return spec;
  } catch (error) {
    const preview = raw.trim().slice(0, 200) || "<boş çıktı>";
    fail(`${source} JSON olarak çözümlenemedi: ${error.message}\nİlk 200 karakter: ${preview}`);
  }
}

/** OPENAPI_URL tanımlıysa şemayı HTTP üzerinden indirir. */
async function fetchSpecFromUrl(url) {
  console.log(`[gen:api] Şema OPENAPI_URL üzerinden alınıyor: ${url}`);
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    fail(`OPENAPI_URL'e bağlanılamadı (${url}): ${error.message}`);
  }
  if (!response.ok) {
    fail(`OPENAPI_URL ${response.status} ${response.statusText} döndü: ${url}`);
  }
  return parseSpec(await response.text(), `OPENAPI_URL (${url})`);
}

/** Yerel backend'den şemayı döker (cwd: ../backend). */
function dumpSpecFromBackend() {
  const venvPython = join(BACKEND_DIR, ".venv", "bin", "python");
  const python = process.env.PYTHON ?? (existsSync(venvPython) ? venvPython : "python3");

  if (!existsSync(BACKEND_DIR)) {
    fail(`Backend dizini bulunamadı: ${BACKEND_DIR}\nOPENAPI_URL vererek uzak şemadan üretebilirsiniz.`);
  }
  if (!existsSync(python) && python !== "python3") {
    fail(`Python yorumlayıcısı bulunamadı: ${python}\nBackend'de .venv oluşturun veya PYTHON env değişkenini verin.`);
  }

  console.log(`[gen:api] Şema backend'den dökülüyor: ${relative(ROOT, BACKEND_DIR)} (${python})`);
  const result = spawnSync(python, ["-c", PYTHON_APP_DUMP], {
    cwd: BACKEND_DIR,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.error) {
    fail(`Python komutu çalıştırılamadı: ${result.error.message}`);
  }
  if (result.stderr?.trim()) {
    console.error(`[gen:api] backend stderr: ${result.stderr.trim()}`);
  }
  if (result.status !== 0) {
    fail(`Python komutu ${result.status} koduyla çıktı; backend import edilemedi.`);
  }
  return parseSpec(result.stdout, "backend app.openapi() çıktısı");
}

/** openapi-typescript Node API'siyle TypeScript tiplerini üretir. */
async function generateTypes(spec) {
  let contents;
  try {
    const ast = await openapiTS(spec);
    contents = astToString(ast);
  } catch (error) {
    fail(`openapi-typescript tipleri üretemedi: ${error.message}`);
  }
  await mkdir(dirname(TYPES_PATH), { recursive: true });
  await writeFile(TYPES_PATH, contents, "utf8");
  return contents.split("\n").length;
}

async function main() {
  const url = process.env.OPENAPI_URL?.trim();
  const spec = url ? await fetchSpecFromUrl(url) : dumpSpecFromBackend();

  const pathCount = Object.keys(spec.paths ?? {}).length;
  await writeFile(OPENAPI_PATH, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
  console.log(`[gen:api] openapi.json yazıldı: ${pathCount} path`);

  const lineCount = await generateTypes(spec);
  console.log(`[gen:api] src/types/generated.ts üretildi: ${lineCount} satır`);
  console.log("[gen:api] Bitti. Çıktıları commit etmeyi unutmayın.");
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
