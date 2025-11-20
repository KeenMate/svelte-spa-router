export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'example/**',           // Ignore entire example folder
      'result/**',
      '*.min.js',
      '**/*.svelte',          // Ignore Svelte files (need svelte-eslint-parser)
      '**/*.html',            // Ignore HTML files
      'src/lib/vendor/**'     // Ignore vendored third-party libraries
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        history: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly',

        // Standard JavaScript globals
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        structuredClone: 'readonly',
        confirm: 'readonly',

        // Events
        Event: 'readonly',
        CustomEvent: 'readonly',
        HashChangeEvent: 'readonly',
        PopStateEvent: 'readonly',

        // Svelte 5 runes (compiled away, but used in source)
        $state: 'readonly',
        $derived: 'readonly',
        $effect: 'readonly',
        $props: 'readonly',
        $inspect: 'readonly',

        // Build-time constants (injected by Vite/Rollup during build)
        __VERSION__: 'readonly',
        __PACKAGE_NAME__: 'readonly',
        __AUTHOR__: 'readonly',
        __LICENSE__: 'readonly',
        __REPOSITORY__: 'readonly',
        __HOMEPAGE__: 'readonly'
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
