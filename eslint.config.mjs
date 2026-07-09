import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import next from "eslint-plugin-next";

const eslintConfig = defineConfig([
  js.configs.recommended,
  next.configs.recommended,
  next.configs["core-web-vitals"],
  {
    rules: {
      "react/no-unknown-property": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
  // TypeScript config
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
    },
  },
  // Override default ignores
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
