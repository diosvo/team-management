import { FlatCompat } from '@eslint/eslintrc';
import pluginSecurity from 'eslint-plugin-security';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const OFF = 0;
const WARNING = 1;
const ERROR = 2;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const pluginSecurityConfigs = [
  pluginSecurity.configs.recommended,
  {
    rules: {
      'security/detect-object-injection': OFF,
    },
  },
];

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  ...pluginSecurityConfigs,
  {
    rules: {
      // for Object destructuring
      '@typescript-eslint/no-unused-vars': [
        ERROR,
        { ignoreRestSiblings: true },
      ],
    },
  },
];

export default eslintConfig;
