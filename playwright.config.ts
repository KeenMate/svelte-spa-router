import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for end-to-end tests against the example app (history mode).
 *
 * The example dev server runs on port 5050 (see example/vite.config.js).
 * Playwright spins it up automatically before tests and reuses an already-
 * running server if one is detected (so `make dev` in another terminal won't
 * conflict).
 *
 * Run:
 *   npm run test:e2e:install   # one-time: download chromium binary
 *   npm run test:e2e           # headless run
 *   npm run test:e2e:ui        # Playwright Test UI (debugging)
 *   npm run test:e2e:headed    # watch the browser do its thing
 *
 * Fixtures live in example/src/routes/test/ — kept separate from the demo
 * routes so they can stay minimal and deterministic. See /test/ in the running
 * app for the index of available fixtures.
 */
export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    expect: { timeout: 5_000 },

    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    reporter: process.env.CI ? 'github' : 'list',

    use: {
        baseURL: 'http://localhost:5050',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 800 }
            }
        }
    ],

    // Auto-start the example dev server in history mode on port 5050.
    // Requires `example/node_modules` to be present — run `make install` or
    // `cd example && npm install` once before the first e2e run.
    webServer: {
        command: 'npm run dev:history',
        cwd: 'example',
        url: 'http://localhost:5050',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        stdout: 'ignore',
        stderr: 'pipe'
    }
})
