import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/api/**/*.ts", "lib/**/*.ts"],
    rules: {
      // The copied SWE adapters still contain untyped raw-query DTOs. Keep them
      // visible to TypeScript while new/touched code uses explicit types.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "SWE/**",
    "src/_pages/**",
    ".agents/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
