import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Üretilmiş OpenAPI tipleri lint kapsamı dışında.
    "src/types/generated.ts",
  ]),
  {
    // Güvenlik: AI üretimi rapor içeriği gibi HTML yüzeyleri sanitize edilene kadar
    // (S-03, Faz 5) dangerouslySetInnerHTML tamamen yasak.
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            "dangerouslySetInnerHTML yasak: sanitizasyon kararı (S-03) alınana kadar kullanılamaz.",
        },
        {
          selector: "Property[key.name='dangerouslySetInnerHTML']",
          message:
            "dangerouslySetInnerHTML özelliği yasak: sanitizasyon kararı (S-03) alınana kadar kullanılamaz.",
        },
      ],
    },
  },
]);

export default eslintConfig;
