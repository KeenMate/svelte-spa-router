import { test, expect, type Page } from '@playwright/test'

/**
 * Router events + 404 coverage — exercises onRouteLoading, onRouteLoaded,
 * onNotFound. App.svelte records each into:
 *   window.__routeLoadingEvents   — { location, route }[]
 *   window.__routeLoadedEvents    — { location, route, params }[]
 *   window.__notFoundEvents       — { location, querystring }[]
 *
 * No dedicated fixture page — drives navigation against existing routes
 * (/test/navigation, /test/navigation/:id) and the global '*' catch-all.
 */

type LoadedEvent = { location?: string; relativeLocation?: string; route?: string; params?: Record<string, string> }
type NotFoundEvent = { location?: string; relativeLocation?: string; querystring?: string }

async function resetEvents(page: Page) {
    await page.evaluate(() => {
        const w = window as unknown as {
            __routeLoadingEvents: LoadedEvent[]
            __routeLoadedEvents: LoadedEvent[]
            __notFoundEvents: NotFoundEvent[]
        }
        w.__routeLoadingEvents = []
        w.__routeLoadedEvents = []
        w.__notFoundEvents = []
    })
}

async function loadedEvents(page: Page): Promise<LoadedEvent[]> {
    return page.evaluate(() => (window as unknown as { __routeLoadedEvents: LoadedEvent[] }).__routeLoadedEvents ?? [])
}

async function loadingEvents(page: Page): Promise<LoadedEvent[]> {
    return page.evaluate(() => (window as unknown as { __routeLoadingEvents: LoadedEvent[] }).__routeLoadingEvents ?? [])
}

async function notFoundEvents(page: Page): Promise<NotFoundEvent[]> {
    return page.evaluate(() => (window as unknown as { __notFoundEvents: NotFoundEvent[] }).__notFoundEvents ?? [])
}

test.describe('onRouteLoading / onRouteLoaded', () => {
    test('both fire when navigating to a regular route', async ({ page }) => {
        await page.goto('/test/navigation')
        await resetEvents(page)

        await page.getByTestId('btn-push-with-id').click()
        await expect(page.getByTestId('location')).toHaveText('/test/navigation/42')

        await expect.poll(() => loadedEvents(page)).toContainEqual(
            expect.objectContaining({ location: '/test/navigation/42' })
        )
        await expect.poll(() => loadingEvents(page)).toContainEqual(
            expect.objectContaining({ location: '/test/navigation/42' })
        )
    })

    test('onRouteLoaded.detail.params reflects the matched route params', async ({ page }) => {
        await page.goto('/test/navigation')
        await resetEvents(page)

        await page.getByTestId('btn-push-with-id').click()
        await expect(page.getByTestId('location')).toHaveText('/test/navigation/42')

        const events = await loadedEvents(page)
        const match = events.find((e) => e.location === '/test/navigation/42')
        expect(match).toBeDefined()
        expect(match!.params).toMatchObject({ id: '42' })
    })
})

test.describe('NotFound (catch-all *) component', () => {
    test('an unknown path matches the catch-all and renders NotFound', async ({ page }) => {
        // The app-level Router has '*': NotFound, so the catch-all matches every
        // URL and renders the NotFound component.
        await page.goto('/this-route-does-not-exist-anywhere')
        await expect(page.getByRole('heading', { name: /404.*Not Found/i })).toBeVisible()
    })

    test('onNotFound also fires when the catch-all matches', async ({ page }) => {
        // Even though '*' is a "match" from the route table's perspective, it is
        // semantically a 404. The Router fires onNotFound for catch-all matches so
        // apps can still log/track unmatched routes alongside rendering a 404 page.
        await page.goto('/test/navigation')
        await resetEvents(page)

        await page.goto('/another-unknown-path?from=test')
        await expect(page.getByRole('heading', { name: /404.*Not Found/i })).toBeVisible()

        await expect.poll(() => notFoundEvents(page)).toContainEqual(
            expect.objectContaining({ location: '/another-unknown-path', querystring: 'from=test' })
        )
    })

    test('relativeLocation equals location on the root Router (no prefix)', async ({ page }) => {
        // The app-level Router has no `prefix`, so the prefix-stripped view is
        // identical to the full URL. Locks in the no-prefix contract.
        await page.goto('/test/navigation')
        await resetEvents(page)

        await page.goto('/yet-another-unknown?x=1')
        await expect(page.getByRole('heading', { name: /404.*Not Found/i })).toBeVisible()

        await expect.poll(() => notFoundEvents(page)).toContainEqual(
            expect.objectContaining({
                location: '/yet-another-unknown',
                relativeLocation: '/yet-another-unknown'
            })
        )
    })
})

test.describe('onNotFound (via nested Router without catch-all)', () => {
    type EmbeddedNotFoundEvent = NotFoundEvent & { relativeLocation?: string }

    async function readEmbeddedEvents(page: Page): Promise<EmbeddedNotFoundEvent[]> {
        return page.evaluate(
            () => (window as unknown as { __embeddedNotFoundEvents: EmbeddedNotFoundEvent[] }).__embeddedNotFoundEvents ?? []
        )
    }

    test('fires when a child path does not match any registered route', async ({ page }) => {
        await page.goto('/test/embed/missing')

        // `location` is the full app URL (useful for logging / re-navigating).
        // `relativeLocation` is what the nested Router sees after stripping its
        // prefix (useful when reasoning about the router's own routing decisions).
        await expect.poll(() => readEmbeddedEvents(page)).toContainEqual(
            expect.objectContaining({
                location: '/test/embed/missing',
                relativeLocation: '/missing'
            })
        )
    })

    test('detail.querystring carries the request querystring', async ({ page }) => {
        await page.goto('/test/embed/missing-page?reason=test&foo=bar')

        const events = await readEmbeddedEvents(page)
        const match = events.find((e) => e.location === '/test/embed/missing-page')
        expect(match).toBeDefined()
        expect(match!.relativeLocation).toBe('/missing-page')
        expect(match!.querystring).toContain('reason=test')
        expect(match!.querystring).toContain('foo=bar')
    })
})
