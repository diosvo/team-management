import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths(), react()], // For React component testing
  test: {
    environment: 'jsdom', // Simulate a browser environment
    setupFiles: ['./test/setup.ts'], // Reference a setup file
    globals: true, // Utilities functions (like describe, it, etc.)
    css: true, // CSS processing during tests
    exclude: ['node_modules', 'dist'],
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
        '**/proxy.ts',
        '**/routes.ts',
        '**/providers/**',
      ],
    },
  },
});
