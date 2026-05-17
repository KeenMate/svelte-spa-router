import { test, expect, type Page } from '@playwright/test'

/**
 * Link / active action fixture coverage — exercises use:link (SPA navigation,
 * modifier-key bypass, target=_blank passthrough) and use:active (default
 * className, custom className, prefix-pattern path, regex path) against
 * example/src/routes/test/LinkActionsTest.svelte.
 *
 * Routes:
 *   /test/links           — fixture page
 *   /test/links/target    — destination for the navigation links
 *
 * Testids:
 *   location
 *   link-plain, link-blank, link-self
 *   active-self, active-target
 *   active-custom-class
 *   active-prefix, active-regex
 */

const FIXTURE = '/test/links'
const TARGET = '/test/links/target'

async function gotoFixture(page: Page) {
    await page.goto(FIXTURE)
    await expect(page.getByTestId('location')).toHaveText(FIXTURE)
}

test.describe('use:link — navigation', () => {
    test('plain click does SPA navigation (URL updates, no full page load)', async ({ page }) => {
        await gotoFixture(page)

        // Drop a sentinel on `window` — if the page reloads, it'll be gone.
        await page.evaluate(() => { (window as unknown as { __sentinel: boolean }).__sentinel = true })

        await page.getByTestId('link-plain').click()

        await expect(page.getByTestId('location')).toHaveText(TARGET)
        await expect(page).toHaveURL(/\/test\/links\/target$/)

        const sentinelStillThere = await page.evaluate(
            () => (window as unknown as { __sentinel?: boolean }).__sentinel === true
        )
        expect(sentinelStillThere).toBe(true)
    })

    test('Ctrl-click does NOT change the current location (browser handles it)', async ({ context, page }) => {
        await gotoFixture(page)

        // Ctrl+click in chromium pops a new page. Swallow it so it doesn't dangle.
        const popupPromise = context.waitForEvent('page').catch(() => null)
        await page.getByTestId('link-plain').click({ modifiers: ['Control'] })
        const popup = await popupPromise
        if (popup) {
            await popup.close().catch(() => { /* already closed */ })
        }

        // The current page's location should not have moved.
        await expect(page.getByTestId('location')).toHaveText(FIXTURE)
        await expect(page).toHaveURL(/\/test\/links$/)
    })

    test('target=_blank link does NOT change the current location', async ({ context, page }) => {
        await gotoFixture(page)

        const popupPromise = context.waitForEvent('page').catch(() => null)
        await page.getByTestId('link-blank').click()
        const popup = await popupPromise
        if (popup) {
            await popup.close().catch(() => { /* already closed */ })
        }

        await expect(page.getByTestId('location')).toHaveText(FIXTURE)
    })
})

test.describe('use:active — default className', () => {
    test('matches the link whose href equals the current location', async ({ page }) => {
        await gotoFixture(page)

        await expect(page.getByTestId('active-self')).toHaveClass(/(^|\s)active(\s|$)/)
        await expect(page.getByTestId('active-target')).not.toHaveClass(/(^|\s)active(\s|$)/)
    })

    test('updates after SPA navigation', async ({ page }) => {
        await gotoFixture(page)

        await page.getByTestId('link-plain').click()
        await expect(page.getByTestId('location')).toHaveText(TARGET)

        await expect(page.getByTestId('active-target')).toHaveClass(/(^|\s)active(\s|$)/)
        await expect(page.getByTestId('active-self')).not.toHaveClass(/(^|\s)active(\s|$)/)
    })
})

test.describe('use:active — custom className', () => {
    test('applies the configured class instead of the default "active"', async ({ page }) => {
        await page.goto(TARGET)
        await expect(page.getByTestId('location')).toHaveText(TARGET)

        const a = page.getByTestId('active-custom-class')
        await expect(a).toHaveClass(/(^|\s)nav-current(\s|$)/)
        // 'active' should NOT be applied to this element — only the custom class.
        await expect(a).not.toHaveClass(/(^|\s)active(\s|$)/)
    })
})

test.describe('use:active — explicit path patterns', () => {
    test('prefix path "/test/links/*" matches sub-paths', async ({ page }) => {
        await page.goto(TARGET)
        await expect(page.getByTestId('location')).toHaveText(TARGET)

        await expect(page.getByTestId('active-prefix')).toHaveClass(/(^|\s)active(\s|$)/)
    })

    test('regex path is honored against current location', async ({ page }) => {
        await page.goto(TARGET)
        await expect(page.getByTestId('location')).toHaveText(TARGET)

        await expect(page.getByTestId('active-regex')).toHaveClass(/(^|\s)active(\s|$)/)
    })
})
