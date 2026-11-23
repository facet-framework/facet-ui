import js from "@eslint/js";
import jest from "eslint-plugin-jest";
import a11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * ESLint for the whole repository — library, Storybooks, configuration.
 *
 * The rule selection follows what can actually go wrong in this project.
 * Every component is a pair of a pure view and an HOC, and the HOCs are full
 * of `useMemo`, `useEffect` and timers: a forgotten dependency is not a style
 * issue here but a value that stops following its source. The same holds for
 * accessibility — WCAG is a requirement, and without a check it stays a
 * declaration of intent.
 *
 * Prettier is not wired in: `pnpm format:check` checks formatting, and two
 * tools complaining about the same line report the same finding twice.
 */
export default tseslint.config(
  {
    ignores: [
      // Generated build output.
      "dist/**",
      "examples/*/dist/**",
      "storybook-static/**",
      "storybook-facet-static/**",
      // Generated story data (see its header).
      "src/facet/fixtures/registry.ts",
      "coverage/**",
      "**/node_modules/**",
    ],
  },

  { files: ["scripts/**/*.mjs"], languageOptions: { globals: globals.node } },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  /* Everything that is TypeScript. */
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    plugins: { react, "react-hooks": reactHooks, "jsx-a11y": a11y },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs["recommended-latest"].rules,
      ...a11y.flatConfigs.recommended.rules,

      // An unused argument whose name starts with _ is a statement about the
      // signature, not an oversight.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // The data layer reads foreign YAML. `unknown` is the honest answer
      // there; `any` would be a claim about something unchecked.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Props are described through TypeScript, not through propTypes.
      "react/prop-types": "off",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  /* Tests. */
  {
    files: ["**/*.spec.{ts,tsx}", "**/jest.setup.ts", "test/**/*.ts"],
    plugins: { jest },
    languageOptions: { globals: globals.jest },
    rules: {
      ...jest.configs["flat/recommended"].rules,
      // A test may call a component by hand with incomplete props to hit
      // exactly one branch.
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  /* Storybook. */
  ...storybook.configs["flat/recommended"],

  /* Configuration files run in Node, not in the browser. */
  {
    files: ["*.{ts,mjs,js}", ".storybook/**/*.{ts,tsx}", ".storybook-facet/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.node },
    rules: { "no-console": "off" },
  },
);
