import js from "@eslint/js"
import tseslint from "typescript-eslint"
import prettier from "eslint-config-prettier"

export default tseslint.config(
  {
    ignores: [
      ".plasmo",
      "build",
      "dist",
      "coverage",
      "node_modules",
      "eslint.config.js",
      "postcss.config.cjs",
      "prettier.config.cjs",
      "tailwind.config.cjs",
      "vitest.config.ts",
      "playwright.config.ts"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off"
    }
  },
  prettier
)
