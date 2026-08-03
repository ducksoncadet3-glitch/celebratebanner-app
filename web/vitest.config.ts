import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Unit tests only (pure logic). The proof mapping and helpers import type-only from the
 * render-engine workspace package, so a plain `node` environment with tsconfig path aliases
 * is all that's needed — no jsdom, no Next runtime.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});
