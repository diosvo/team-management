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
  },
});
