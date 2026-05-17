import { test, expect } from '@playwright/test'

/**
 * wrap() coverage — exercises routeContext access, asyncComponent loading
 * with a loadingComponent, and static props.
 *
 * Routes:
 *   /test/wrap            wrap({ component, routeContext, title })
 *   /test/wrap/async      wrap({ asyncComponent (250ms delay), loadingComponent, shouldDisplayLoadingOnRouteLoad })
 *   /test/wrap/with-props wrap({ component, props: { staticGreeting }, routeContext })
 *
 * The fixture (WrapTest.svelte) surfaces routeContext() and the routeContext
 * field values via testids; the async target/loading components have their own
 * heading testids (wrap-async-heading, wrap-loading-heading).
 */

test.describe('wrap() + routeContext', () => {
    test('routeContext() exposes the configured fields', async ({ page }) => {
        await page.goto('/test/wrap')

        await expect(page.getByTestId('wrap-heading')).toBeVisible()
        await expect(page.getByTestId('ctx-section')).toHaveText('wrap-fixture')
        await expect(page.getByTestId('route-context')).toContainText('"customField":"Hello from routeContext!"')
    })

    test('routeContext().title is set from the title field', async ({ page }) => {
        await page.goto('/test/wrap')
        await expect(page.getByTestId('ctx-title')).toHaveText('Wrap Root')
    })
})

test.describe('wrap() + asyncComponent + loadingComponent', () => {
    test('shows the loadingComponent while the async target imports', async ({ page }) => {
        // shouldDisplayLoadingOnRouteLoad=true → loading shows for the 250ms delay.
        // Navigate via in-page link so we capture the intermediate loading state
        // without a full page reload swallowing it.
        await page.goto('/test/wrap')
        await page.getByTestId('link-async').click()

        await expect(page.getByTestId('wrap-loading-heading')).toBeVisible()

        // Then the async target replaces it.
        await expect(page.getByTestId('wrap-async-heading')).toBeVisible()
        await expect(page.getByTestId('wrap-loading-heading')).toHaveCount(0)
    })

    test('the async target mounts after the import resolves', async ({ page }) => {
        await page.goto('/test/wrap/async')

        await expect(page.getByTestId('wrap-async-heading')).toBeVisible({ timeout: 5000 })
        await expect(page).toHaveURL(/\/test\/wrap\/async$/)
    })
})

test.describe('wrap() + static props', () => {
    test('the props field is forwarded to the component', async ({ page }) => {
        await page.goto('/test/wrap/with-props')

        await expect(page.getByTestId('wrap-heading')).toBeVisible()
        await expect(page.getByTestId('static-greeting')).toHaveText('hello from props')
    })

    test('routeContext from the wrap() call coexists with static props', async ({ page }) => {
        await page.goto('/test/wrap/with-props')

        await expect(page.getByTestId('ctx-section')).toHaveText('wrap-props')
        await expect(page.getByTestId('static-greeting')).toHaveText('hello from props')
    })
})
