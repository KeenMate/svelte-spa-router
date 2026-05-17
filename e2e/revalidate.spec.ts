import { test, expect, type Page } from '@playwright/test'

/**
 * Revalidate fixture — exercises revalidateCurrentRoute() and the
 * onRevalidationFailure callback wired up in main.js / App.svelte.
 *
 * Fixture testids:
 *   revalidate-fixture-heading | user-name | has-admin | protected-heading
 *
 * Buttons:
 *   btn-downgrade-revalidate | btn-upgrade-revalidate | btn-just-revalidate
 *
 * App scaffold:
 *   window.__revalidationFailureCalls — array of detail payloads pushed by
 *   the configured onRevalidationFailure handler.
 */

type FailureCall = {
    route?: string
    location?: string
    relativeLocation?: string
    querystring?: string
    params?: Record<string, string>
    isPermissionFailure?: boolean
}

async function readFailureCalls(page: Page): Promise<FailureCall[]> {
    return page.evaluate(
        () => (window as unknown as { __revalidationFailureCalls: FailureCall[] }).__revalidationFailureCalls ?? []
    )
}

async function resetFailureCalls(page: Page) {
    await page.evaluate(() => {
        (window as unknown as { __revalidationFailureCalls: FailureCall[] }).__revalidationFailureCalls = []
    })
}

test.describe('revalidateCurrentRoute()', () => {
    test('on a protected route, downgrading the user + revalidating triggers onRevalidationFailure', async ({ page }) => {
        await page.goto('/test/revalidate')

        // Start as Audrey (admin). The fixture's hasPermission(admin) should be true.
        const adminStatus = page.getByTestId('has-admin')
        if ((await adminStatus.textContent())?.trim() !== 'true') {
            // Upgrade if the previous test left us as Donna.
            await page.getByTestId('btn-upgrade-revalidate').click()
            await expect(adminStatus).toHaveText('true')
        }

        // Navigate to the admin-protected sub-route.
        await page.getByTestId('link-protected').click()
        await expect(page.getByTestId('protected-heading')).toBeVisible()
        await expect(page).toHaveURL(/\/test\/revalidate\/protected$/)

        await resetFailureCalls(page)

        // Downgrade to Donna (no admin) and revalidate the current route.
        await page.getByTestId('btn-downgrade-revalidate').click()

        // onRevalidationFailure should fire (debounce window is ~50ms).
        await expect.poll(() => readFailureCalls(page)).toContainEqual(
            expect.objectContaining({
                route: '/test/revalidate/protected',
                location: '/test/revalidate/protected',
                relativeLocation: '/test/revalidate/protected',
                isPermissionFailure: true
            })
        )

        // Because the callback was configured and didn't navigate, the URL
        // should stay on the protected route — the user can be prompted/etc.
        await expect(page).toHaveURL(/\/test\/revalidate\/protected$/)
    })

    test('revalidating an authorized route does NOT trigger the failure callback', async ({ page }) => {
        await page.goto('/test/revalidate')

        // Ensure we're Audrey (admin) so the protected route is accessible.
        const adminStatus = page.getByTestId('has-admin')
        if ((await adminStatus.textContent())?.trim() !== 'true') {
            await page.getByTestId('btn-upgrade-revalidate').click()
            await expect(adminStatus).toHaveText('true')
        }

        await page.getByTestId('link-protected').click()
        await expect(page.getByTestId('protected-heading')).toBeVisible()

        await resetFailureCalls(page)

        // Just revalidate without changing the user — should pass cleanly.
        await page.getByTestId('btn-just-revalidate').click()

        // Give the debounce window + a small buffer to NOT fire.
        await page.waitForTimeout(200)

        const calls = await readFailureCalls(page)
        expect(calls).toEqual([])

        // Protected page still mounted (no re-render, no flicker).
        await expect(page.getByTestId('protected-heading')).toBeVisible()
    })

    test('revalidating an unprotected route is a no-op', async ({ page }) => {
        await page.goto('/test/revalidate')
        await expect(page.getByTestId('revalidate-fixture-heading')).toBeVisible()

        await resetFailureCalls(page)

        // Downgrade + revalidate while sitting on the unprotected fixture page.
        await page.getByTestId('btn-downgrade-revalidate').click()

        await page.waitForTimeout(200)

        // No callback fired — the current route has no admin requirement.
        const calls = await readFailureCalls(page)
        expect(calls).toEqual([])

        // Fixture still mounted.
        await expect(page.getByTestId('revalidate-fixture-heading')).toBeVisible()
    })
})
