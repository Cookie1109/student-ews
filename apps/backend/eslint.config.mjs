import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/api/**/*.ts", "lib/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "dist/**", "next-env.d.ts"]),
]);
