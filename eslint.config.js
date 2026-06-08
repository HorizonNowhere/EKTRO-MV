import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/*.d.ts', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Tests and injected fakes legitimately use `any` and non-null assertions.
    files: ['**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Mock/fake callbacks frequently ignore their arguments.
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^_' }],
    },
  },
  {
    // The Remotion app uses the automatic JSX runtime; a `React` import may be unused.
    files: ['**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^React$' }],
    },
  },
);
