import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import security from "eslint-plugin-security";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  sonarjs.configs.recommended,
  security.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": "off", // Too noisy (199 matches)
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/unbound-method": "off", // Too noisy in React/Testing (181 matches)
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],

      "sonarjs/no-duplicate-string": ["warn", { threshold: 5 }],
      "sonarjs/cognitive-complexity": ["warn", 20],
      "sonarjs/no-identical-functions": "warn",
      "sonarjs/no-collapsible-if": "warn",
      "sonarjs/concise-regex": "off", // Preference, not security
      "sonarjs/prefer-read-only-props": "off", // Too noisy (32 matches)

      "security/detect-object-injection": "off",
      "security/detect-non-literal-regexp": "off",
      "security/detect-unsafe-regex": "error",
    },
  },
  {
    files: [
      "src/infrastructure/contracts/*.ts",
      "src/infrastructure/repositories/*.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["src/**/__tests__/**", "src/**/*.test.*"],
    rules: {
      "sonarjs/no-duplicate-string": "off",
      "security/detect-object-injection": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "build/**", "vite.config.ts", "scripts/**"],
  }
);
