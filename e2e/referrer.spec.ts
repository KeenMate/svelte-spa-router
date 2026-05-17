import { test, expect } from '@playwright/test'

/**
 * Full referrer-object coverage — verifies that navigationContext().referrer
 * exposes every documented field (location, routeName, querystring, params)
 * after a navigation.
 *
 * Routes registered against ReferrerTest.svelte:
 *   testReferrerFrom → /test/referrer/from/:source
 *   testReferrerTo   → /test/referrer/to/:dest
 *
 * setIncludeReferrer('always') is enabled in main.js so referrer is always populated.
 */

test.describe('referrer after a named-route push', () => {
    test('exposes location, routeName, querystring, params', async ({ page }) => {
        // routeName is captured during the push that arrives at a route — direct
        // page.goto doesn't capture one. So we drive two pushes from the fixture:
        // 1) push to testReferrerFrom (named) — captures routeName for /from/origin
        // 2) push to testReferrerTo (named)   — referrer for /to/page-b carries the captured info
        await page.goto('/test/referrer/to/start')
        await page.getByTestId('btn-push-from-named').click()
        await expect(page.getByTestId('location')).toHaveText('/test/referrer/from/origin')

        await page.getByTestId('btn-push-to-named').click()
        await expect(page.getByTestId('location')).toHaveText('/test/referrer/to/page-b')

        await expect(page.getByTestId('referrer-location')).toHaveText('/test/referrer/from/origin')
        await expect(page.getByTestId('referrer-route-name')).toHaveText('testReferrerFrom')
        await expect(page.getByTestId('referrer-querystring')).toContainText('source-q=1')
        await expect(page.getByTestId('referrer-params')).toContainText('"source":"origin"')
    })
})

test.describe('referrer after a raw-path push', () => {
    test('exposes location, querystring, params (routeName may be the path if no name registered)', async ({ page }) => {
        await page.goto('/test/referrer/from/origin?source-q=1')
        await expect(page.getByTestId('location')).toHaveText('/test/referrer/from/origin')

        await page.getByTestId('btn-push-to-path').click()
        await expect(page.getByTestId('location')).toHaveText('/test/referrer/to/raw')

        await expect(page.getByTestId('referrer-location')).toHaveText('/test/referrer/from/origin')
        await expect(page.getByTestId('referrer-querystring')).toHaveText('source-q=1')
        await expect(page.getByTestId('referrer-params')).toContainText('"source":"origin"')
    })
})
