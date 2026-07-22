import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // Base recommended rules from @eslint/js (flat config).
    ...js.configs.recommended,
    // Register plugin objects explicitly (flat config requires an object map,
    // not a string array) and apply each plugin's recommended rules.
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      // Dev-only fast-refresh DX rule. Downgraded from error: it produces
      // false positives on the standard pattern of exporting a hook/context
      // next to its Provider (e.g. useAuth, useLayout), which would otherwise
      // block `npm run lint` on working context files.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
