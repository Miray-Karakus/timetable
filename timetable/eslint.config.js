import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: 'Use a string union instead of enum.' },
        { selector: 'TSParameterProperty', message: 'Declare class fields explicitly instead of parameter properties.' },
        { selector: 'TSModuleDeclaration[declare!=true]', message: 'Namespaces are not erasable syntax.' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
])
