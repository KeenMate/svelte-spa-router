import { test, expect } from '@playwright/test'

/**
 * Error handling fixture — exercises GlobalErrorHandler with the configuration
 * from main.js: strategy='navigateSafe', safeRoute='/', and
 * ignoreErrors=[/ResizeObserver loop/i].
 *
 * The fixture throws errors out of the Svelte event-handler context (via
 * setTimeout) so they become genuine window-level unhandled errors.
 */

test.describe('GlobalErrorHandler — navigateSafe strategy', () => {
    test('an unhandled error navigates the app to the configured safe route', async ({ page }) => {
        await page.goto('/test/error')
        await expect(page.getByTestId('error-fixture-heading')).toBeVisible()

        // Playwright fails tests when a page error bubbles up. Swallow it.
        page.on('pageerror', () => { /* expected */ })

        await page.getByTestId('btn-throw').click()

        // navigateSafe pushes to '/'.
        await expect(page).toHaveURL(/localhost:5050\/$/)
    })

    test('console.error is invoked via the configured onError callback', async ({ page }) => {
        // main.js wires onError to console.error a structured payload. We watch
        // for that to confirm the GlobalErrorHandler caught the error and called
        // the user-supplied callback (separate from the navigateSafe action).
        // onError is the supported integration point for toasts / Sentry / etc.
        const errorLogs: string[] = []
        page.on('console', (msg) => {
            if (msg.type() === 'error') errorLogs.push(msg.text())
        })
        page.on('pageerror', () => { /* expected */ })

        await page.goto('/test/error')
        await page.getByTestId('btn-throw').click()
        await expect(page).toHaveURL(/localhost:5050\/$/)

        const hasGlobalErrorLog = errorLogs.some((line) => line.includes('Global error caught'))
        expect(hasGlobalErrorLog).toBe(true)
    })
})

test.describe('GlobalErrorHandler — ignoreErrors', () => {
    test('errors matching an ignoreErrors pattern do NOT trigger navigateSafe', async ({ page }) => {
        await page.goto('/test/error')
        page.on('pageerror', () => { /* expected */ })

        await page.getByTestId('btn-throw-ignored').click()

        // Give navigateSafe a moment to NOT fire. URL should stay on /test/error.
        await page.waitForTimeout(300)
        await expect(page).toHaveURL(/\/test\/error$/)
    })
})
