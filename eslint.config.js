export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'example/node_modules/**',
      'example/dist/**',
      'result/**',
      '*.min.js'
    ]
  },
  {
    files: ['**/*.js', '**/*.svelte'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        history: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'warn'
    }
  }
]
