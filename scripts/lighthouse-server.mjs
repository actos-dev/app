#!/usr/bin/env node
/**
 * Lighthouse CI sunucu sarmalayıcısı (Faz 6 / Birim 6.1b, plan P-01).
 *
 * `lhci autorun` tek bir `startServerCommand` başlatır; oysa üretim sunumu
 * (Next, 3100) ve stub backend (7055) birlikte gerekir. Bu sarmalayıcı:
 *   1) Stub 7055'te değilse `e2e/stub-backend.mjs` başlatır,
 *   2) `npm run start`'ı `API_BASE_URL` stub'a ve `PORT=3100` ile başlatır,
 *   3) SIGTERM/SIGINT'te iki alt süreci de temizler.
 *
 * Böylece hem CI'da ayrı bir stub adımı gerekmez hem de yerelde `npm run
 * lighthouse` kendi kendine yeter. `staticDistDir` KULLANILMAZ: sayfalar
 * çerez/başlık okuyan dinamik (ƒ) rotalardır, önceden çıkarılmış statik
 * dosya yoktur.
 */
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STUB_PORT = process.env.STUB_PORT ?? "7055";
const STUB_URL = `http://127.0.0.1:${STUB_PORT}`;
const APP_PORT = process.env.PORT ?? "3100";

/** Stub zaten ayakta mı? (CI'da ayrı adımda başlatılmış olabilir.) */
async function stubIsUp() {
  try {
    const response = await fetch(`${STUB_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

const children = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
    }
  }
  process.exitCode = code;
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => shutdown(0));
}

if (!(await stubIsUp())) {
  const stub = spawn("node", ["e2e/stub-backend.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, STUB_PORT },
  });
  children.push(stub);
  stub.on("exit", (code) => {
    if (!shuttingDown) shutdown(code ?? 1);
  });
}

const app = spawn("npm", ["run", "start"], {
  cwd: ROOT,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: APP_PORT,
    API_BASE_URL: STUB_URL,
    NEXT_PUBLIC_SITE_URL: `http://localhost:${APP_PORT}`,
  },
});
children.push(app);
app.on("exit", (code) => {
  if (!shuttingDown) shutdown(code ?? 1);
});
