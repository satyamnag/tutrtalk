import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    'next/core-web-vitals',
    'next/typescript',
    'plugin:import/recommended',
    'prettier'
    // Note: 'plugin:prettier/recommended' is intentionally NOT used. Running
    // prettier through eslint-plugin-prettier conflicts with the
    // @trivago/prettier-plugin-sort-imports plugin (duplicates file-header
    // comments and disagrees with prettier --write output). Formatting is
    // enforced by the dedicated `pnpm format:check` step in CI instead.
  ),
];

export default eslintConfig;
