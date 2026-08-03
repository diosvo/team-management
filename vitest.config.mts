import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
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
