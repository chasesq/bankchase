import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals.map((config) => ({
    ...config,
    rules: {
      ...config.rules,
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/purity': 'off',
      'react/no-unescaped-entities': 'off',
    },
  })),
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'coverage/**',
    'public/**',
    'backend/**',
    'ai-gateway-example/**',
    '__tests__/e2e/**',
  ]),
])
