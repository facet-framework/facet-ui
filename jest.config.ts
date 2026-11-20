import type { Config } from "jest";

const config: Config = {
  snapshotResolver: "<rootDir>/test/snapshotResolver.cjs",
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "\\.css$": "<rootDir>/test/styleMock.ts",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      { tsconfig: { jsx: "react-jsx", verbatimModuleSyntax: false, noUnusedLocals: false } },
    ],
  },
  testMatch: ["<rootDir>/src/**/*.spec.ts", "<rootDir>/src/**/*.spec.tsx"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.stories.tsx",
    "!src/i18n/**",
    "!src/**/index.ts",
    "!src/core/fixtures/**",
    "!src/facet/fixtures/**",
  ],
  coverageThreshold: { global: { statements: 90, branches: 80, functions: 90, lines: 90 } },
};

export default config;
