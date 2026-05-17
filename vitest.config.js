import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/tests/setup.js'],
    // Only scan unit tests under src/tests/. Otherwise vitest picks up
    // e2e/*.spec.ts (Playwright tests) and fails because Playwright's
    // test.describe doesn't work under vitest's runner.
    include: ['src/tests/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'example/',
        'example-history/',
        'example-permissions/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ]
    }
  },
  resolve: {
    conditions: ['browser']
  }
})
