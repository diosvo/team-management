import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()], // For React component testing
  resolve: {
    tsconfigPaths: true, // Use tsconfig paths for module resolution
  },
  test: {
    environment: 'jsdom', // Simulate a browser environment
    setupFiles: ['./test/setup.ts'], // Reference a setup file
    globals: true, // Utilities functions (like describe, it, etc.)
    css: true, // CSS processing during tests
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      // Count files no test imports as 0%
      include: ['src/**/*.{ts,tsx}'],
      // `json-summary` writes coverage/coverage-summary.json, which CI reads
      // to post the percentage on the PR.
      reporter: ['text', 'html', 'json-summary'],
      exclude: [
        'coverage/**',
        'test/**',
        '**/*.d.ts',
        '**/*.config.*',
        // Chakra UI components (already well-tested by Chakra)
        '**/components/ui/**',
        // Pure data/type definitions
        '**/utils/constants/**',
        '**/utils/enum.ts',
        '**/utils/type.ts',
        // Drizzle ORM setup & schema definitions
        '**/drizzle/**',
        // Zod schema declarations
        '**/schemas/**',
        // Auth library setup
        '**/lib/auth.ts',
        '**/lib/auth-client.ts',
        // App wiring & config
        '**/routes.ts',
        '**/providers/**',
      ],
    },
  },
});
