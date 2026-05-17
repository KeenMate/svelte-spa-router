import { test, expect, type Page } from '@playwright/test'

/**
 * Named-routes fixture coverage — exercises registerRoutes() / buildUrl() /
 * hasRoute() / getRouteByName() + push/replace by name against
 * example/src/routes/test/NamedRoutesTest.svelte.
 *
 * Registered names (in the fixture):
 *   testNamedHome      → /test/named
 *   testNamedItem      → /test/named/:id
 *   testNamedItemEdit  → /test/named/:id/edit
 *
 * The fixture exposes:
 *   data-testid:
 *     location, querystring, route-params, last-action
 *     has-item              — hasRoute('testNamedItem')
 *     has-fake              — hasRoute('thisRouteDoesNotExist')
 *     item-pattern          — getRouteByName('testNamedItem')
 *     all-keys              — sorted comma-joined Object.keys(getRoutes())
 *     built-simple          — buildUrl('testNamedItem', { id: 42 })
 *     built-with-query      — buildUrl(..., { tab, mode })
 *     built-missing-param   — buildUrl(..., {})
 *     built-unknown         — buildUrl('thisRouteDoesNotExist', { id: 1 })
 *   buttons:
 *     btn-push-by-name              → push('testNamedItem', { id: 99 })
 *     btn-push-by-name-with-query   → push('testNamedItem', { id: 7 }, { tab: 'info' })
 *     btn-replace-by-name           → replace('testNamedItemEdit', { id: 55 })
 *     btn-push-missing-param        → push('testNamedItem', {})
 */

const FIXTURE = '/test/named'

async function gotoFixture(page: Page) {
    await page.goto(FIXTURE)
    await expect(page.getByTestId('location')).toHaveText(FIXTURE)
}

test.describe('registry introspection', () => {
    test('hasRoute returns true for registered names and false for unknown ones', async ({ page }) => {
        await gotoFixture(page)
        await expect(page.getByTestId('has-item')).toHaveText('true')
        await expect(page.getByTestId('has-fake')).toHaveText('false')
    })

    test('getRouteByName returns the registered pattern', async ({ page }) => {
        await gotoFixture(page)
        await expect(page.getByTestId('item-pattern')).toHaveText('/test/named/:id')
    })

    test('getRoutes contains the fixture-registered names alongside the app names', async ({ page }) => {
        await gotoFixture(page)
        const keys = page.getByTestId('all-keys')
        await expect(keys).toContainText('testNamedHome')
        await expect(keys).toContainText('testNamedItem')
        await expect(keys).toContainText('testNamedItemEdit')
    })
})

test.describe('buildUrl()', () => {
    test('substitutes :params into the pattern', async ({ page }) => {
        await gotoFixture(page)
        await expect(page.getByTestId('built-simple')).toHaveText('/test/named/42')
    })

    test('appends a querystring when query params are supplied', async ({ page }) => {
        await gotoFixture(page)
        const built = page.getByTestId('built-with-query')
        await expect(built).toContainText('/test/named/42?')
        await expect(built).toContainText('tab=info')
        await expect(built).toContainText('mode=edit')
    })

    test('substitutes the param placeholder when a required :param is missing', async ({ page }) => {
        await gotoFixture(page)
        // Default param placeholder is 'N-A' (see setParamReplacementPlaceholder).
        await expect(page.getByTestId('built-missing-param')).toHaveText('/test/named/N-A')
    })

    test('returns the name unchanged when the route is unknown', async ({ page }) => {
        await gotoFixture(page)
        await expect(page.getByTestId('built-unknown')).toHaveText('thisRouteDoesNotExist')
    })
})

test.describe('push() / replace() by name', () => {
    test('push(name, params) navigates to the resolved URL and exposes params', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('btn-push-by-name').click()

        await expect(page.getByTestId('location')).toHaveText('/test/named/99')
        await expect(page.getByTestId('route-params')).toContainText('"id":"99"')
        await expect(page).toHaveURL(/\/test\/named\/99$/)
    })

    test('push(name, params, query) appends the querystring', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('btn-push-by-name-with-query').click()

        await expect(page.getByTestId('location')).toHaveText('/test/named/7')
        await expect(page.getByTestId('querystring')).toContainText('tab=info')
        await expect(page).toHaveURL(/\/test\/named\/7\?tab=info/)
    })

    test('replace(name, params) updates location to the resolved URL', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('btn-replace-by-name').click()

        await expect(page.getByTestId('location')).toHaveText('/test/named/55/edit')
        await expect(page).toHaveURL(/\/test\/named\/55\/edit$/)
    })

    test('push(name, {}) for a route with a required :param uses the placeholder', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('btn-push-missing-param').click()

        // Placeholder 'N-A' is URL-encoded by buildUrl, so the URL contains %2D
        // for the dash. The decoded location() string is what the route sees.
        await expect(page.getByTestId('location')).toHaveText('/test/named/N-A')
    })
})
