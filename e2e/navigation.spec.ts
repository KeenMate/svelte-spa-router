import { test, expect, type Page } from '@playwright/test'

/**
 * Navigation fixture coverage — exercises push / replace / goBack and the
 * location() / querystring() / routeParams() / navigationContext() accessors
 * against example/src/routes/test/NavigationTest.svelte.
 *
 * The fixture exposes:
 *   data-testid:
 *     location              — location()
 *     querystring           — querystring()
 *     route-params          — JSON.stringify(routeParams())
 *     route-params-prop     — JSON.stringify(routeParams prop)
 *     nav-context           — JSON.stringify(navigationContext() ?? null)
 *     referrer-location     — navigationContext().referrer?.location
 *     last-action           — id of the last button clicked
 *   buttons:
 *     btn-push-with-id      → push('/test/navigation/42')
 *     btn-push-with-query   → push('/test/navigation?foo=bar&baz=qux')
 *     btn-push-with-context → push('/test/navigation/7', {}, {}, { source, purpose })
 *     btn-replace           → replace('/test/navigation/99')
 *     btn-go-back           → goBack()
 *
 * The example app runs with setIncludeReferrer('always') (see main.js), so
 * every navigation populates navigationContext().referrer — that's what the
 * goBack assertion relies on.
 */

const FIXTURE = '/test/navigation'

async function gotoFixture(page: Page) {
    await page.goto(FIXTURE)
    await expect(page.getByTestId('location')).toHaveText(FIXTURE)
}

test.describe('initial render', () => {
    test('reflects the current location with empty querystring and routeParams', async ({ page }) => {
        await gotoFixture(page)

        await expect(page.getByTestId('querystring')).toHaveText('')
        await expect(page.getByTestId('route-params')).toHaveText('{}')
        await expect(page.getByTestId('route-params-prop')).toHaveText('{}')
        await expect(page.getByTestId('last-action')).toHaveText('none')
    })
})

test.describe('push()', () => {
    test('updates location and exposes the route param via both accessor and prop', async ({ page }) => {
        await gotoFixture(page)

        await page.getByTestId('btn-push-with-id').click()

        await expect(page.getByTestId('location')).toHaveText('/test/navigation/42')
        await expect(page.getByTestId('route-params')).toContainText('"id":"42"')
        await expect(page.getByTestId('route-params-prop')).toContainText('"id":"42"')
        await expect(page).toHaveURL(/\/test\/navigation\/42$/)
    })

    test('with a querystring in the path reflects it via querystring()', async ({ page }) => {
        await gotoFixture(page)

        await page.getByTestId('btn-push-with-query').click()

        const qs = page.getByTestId('querystring')
        await expect(qs).toContainText('foo=bar')
        await expect(qs).toContainText('baz=qux')
        await expect(page).toHaveURL(/foo=bar/)
        await expect(page).toHaveURL(/baz=qux/)
    })

    test('with navigationContext exposes the context on the destination page', async ({ page }) => {
        await gotoFixture(page)

        await page.getByTestId('btn-push-with-context').click()

        await expect(page.getByTestId('location')).toHaveText('/test/navigation/7')
        const ctx = page.getByTestId('nav-context')
        await expect(ctx).toContainText('"source":"fixture"')
        await expect(ctx).toContainText('"purpose":"e2e"')
    })
})

test.describe('replace()', () => {
    test('updates location and the URL', async ({ page }) => {
        await gotoFixture(page)

        await page.getByTestId('btn-replace').click()

        await expect(page.getByTestId('location')).toHaveText('/test/navigation/99')
        await expect(page).toHaveURL(/\/test\/navigation\/99$/)
    })
})

test.describe('goBack()', () => {
    test('navigates to the previous (referrer) route', async ({ page }) => {
        await gotoFixture(page)

        // Establish a referrer chain: /test/navigation → /test/navigation/42.
        await page.getByTestId('btn-push-with-id').click()
        await expect(page.getByTestId('location')).toHaveText('/test/navigation/42')
        await expect(page.getByTestId('referrer-location')).toHaveText('/test/navigation')

        await page.getByTestId('btn-go-back').click()

        await expect(page.getByTestId('location')).toHaveText('/test/navigation')
    })
})

test.describe('pop()', () => {
    test('navigates back to the previous history entry', async ({ page }) => {
        await gotoFixture(page)

        await page.getByTestId('btn-push-with-id').click()
        await expect(page.getByTestId('location')).toHaveText('/test/navigation/42')

        await page.getByTestId('btn-pop').click()

        await expect(page.getByTestId('location')).toHaveText('/test/navigation')
    })
})

test.describe('push() alternative signatures', () => {
    test('array form [route, params, query, navigationContext] navigates and propagates context', async ({ page }) => {
        await gotoFixture(page)

        await page.getByTestId('btn-push-array').click()

        await expect(page.getByTestId('location')).toHaveText('/test/navigation/77')
        await expect(page.getByTestId('route-params')).toContainText('"id":"77"')
        await expect(page.getByTestId('querystring')).toContainText('src=array')
        await expect(page.getByTestId('nav-context')).toContainText('"source":"array-form"')
    })

    test('object form { route, params, query, navigationContext } navigates and propagates context', async ({ page }) => {
        await gotoFixture(page)

        await page.getByTestId('btn-push-object').click()

        await expect(page.getByTestId('location')).toHaveText('/test/navigation/88')
        await expect(page.getByTestId('route-params')).toContainText('"id":"88"')
        await expect(page.getByTestId('querystring')).toContainText('src=object')
        await expect(page.getByTestId('nav-context')).toContainText('"source":"object-form"')
    })
})
