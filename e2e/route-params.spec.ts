import { test, expect, type Page } from '@playwright/test'

/**
 * Route-params fixture coverage — exercises required :param, optional :last?,
 * the wildcard '*' (captured as `wild`), and URL decoding for params.
 *
 * Routes registered against example/src/routes/test/RouteParamsTest.svelte:
 *   /test/params                               (no params)
 *   /test/params/:id                           (required)
 *   /test/params/optional/:first/:last?        (optional second segment)
 *   /test/params/wild/*                        (wildcard, captured as wild)
 *
 * Testids exposed:
 *   location, route-params, route-params-prop, param-keys
 *   param-id, param-first, param-last, param-wild
 * Links / buttons:
 *   link-id-123, link-optional-1, link-optional-2, link-wild, link-reset
 *   btn-push-id-7, btn-push-encoded
 */

const FIXTURE = '/test/params'

async function gotoFixture(page: Page) {
    await page.goto(FIXTURE)
    await expect(page.getByTestId('location')).toHaveText(FIXTURE)
}

test.describe('no params', () => {
    test('routeParams is empty when the route has no :params', async ({ page }) => {
        await gotoFixture(page)
        await expect(page.getByTestId('route-params')).toHaveText('{}')
        await expect(page.getByTestId('param-keys')).toHaveText('')
    })

    test('the routeParams prop and routeParams() accessor agree', async ({ page }) => {
        await gotoFixture(page)
        await expect(page.getByTestId('route-params-prop')).toHaveText('{}')
    })
})

test.describe('required :param', () => {
    test('navigating via link exposes the captured value', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-id-123').click()

        await expect(page.getByTestId('location')).toHaveText('/test/params/123')
        await expect(page.getByTestId('param-id')).toHaveText('123')
        await expect(page.getByTestId('route-params')).toContainText('"id":"123"')
        await expect(page.getByTestId('route-params-prop')).toContainText('"id":"123"')
    })

    test('values arrive as decoded strings (not coerced to numbers)', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('btn-push-id-7').click()

        await expect(page.getByTestId('param-id')).toHaveText('7')
        // Strings, not numbers — routeParams values are always strings.
        await expect(page.getByTestId('route-params')).toContainText('"id":"7"')
    })

    test('URL-encoded characters in a param are decoded into routeParams', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('btn-push-encoded').click()

        // a%2Fb decoded → 'a/b'
        await expect(page.getByTestId('param-id')).toHaveText('a/b')
    })
})

test.describe('optional :last?', () => {
    test('present when the segment is supplied', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-optional-2').click()

        await expect(page.getByTestId('location')).toHaveText('/test/params/optional/john/doe')
        await expect(page.getByTestId('param-first')).toHaveText('john')
        await expect(page.getByTestId('param-last')).toHaveText('doe')
    })

    test('absent when the segment is omitted (last is undefined)', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-optional-1').click()

        await expect(page.getByTestId('location')).toHaveText('/test/params/optional/john')
        await expect(page.getByTestId('param-first')).toHaveText('john')
        // The accessor renders 'undefined' as '' via ?? '' — confirm last is absent.
        await expect(page.getByTestId('param-last')).toHaveText('')
        // Key still exists in params (regexparam sets it to undefined), so JSON shows null/undefined.
        // The reliable check: the param-keys list contains 'first' but not 'last' as a populated value.
        await expect(page.getByTestId('route-params')).not.toContainText('"last":"doe"')
    })
})

test.describe('wildcard *', () => {
    test('captures the rest of the path under params.wild', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-wild').click()

        await expect(page.getByTestId('location')).toHaveText('/test/params/wild/some/deep/path')
        await expect(page.getByTestId('param-wild')).toHaveText('some/deep/path')
        await expect(page.getByTestId('route-params')).toContainText('"wild":"some/deep/path"')
    })
})
