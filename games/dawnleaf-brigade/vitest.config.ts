import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pure-logic tests only: src/systems/ is Phaser-independent, so no DOM is needed.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Scoped to src/systems/ per SPEC-CORE-COMBAT-001 constraint C-7. Scenes,
      // entities and UI are manual-browser-verification targets (tech.md
      // @NAV:DEC-VERIFY-DUAL); counting them here would make the gate
      // structurally unreachable rather than merely strict.
      include: ['src/systems/**/*.ts'],
      reporter: ['text', 'json-summary'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
