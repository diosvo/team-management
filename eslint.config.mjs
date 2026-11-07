import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  // TODO: Fix the rules that are currently turned off
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'import/no-anonymous-default-export': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react/no-children-prop': 'off',
    },
  },
  // `import type` when the whole import is types, inline `type` when mixed with values.
  {
    files: ['**/*.{ts,tsx}'],
    // Reuse the plugin eslint-config-next registers (it isn't a direct dependency).
    plugins: {
      '@typescript-eslint': nextVitals.find(
        (config) => config.plugins?.['@typescript-eslint'],
      ).plugins['@typescript-eslint'],
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
    'playwright/**',
    // Imported from third-party tools (Chakra UI snippets, agent skills).
    'src/components/ui/**',
    '.agents/skills/**',
  ]),
]);

export default eslintConfig;
