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
      exclude: [
        'coverage/**',
        'test/**',
        '**/*.d.ts',
        '**/*.config.*',
        // Chakra UI components (already well-tested by Chakra)
        '**/components/ui/**',
        // Pure data/type definitions
        '**/utils/constant.ts',
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
