import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import {defineConfig, globalIgnores} from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist/', 'coverage/', '.claude/']),
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended],
    rules: {
      // The source leans on `any` for schema-driven data, so this would flag it everywhere.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: globals.mocha,
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'max-lines': ['error', {max: 500, skipComments: true, skipBlankLines: true}],
    },
  },
  // Formatting is left to Prettier, this turns off any rules that would fight it.
  prettier,
);
