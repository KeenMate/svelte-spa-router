import { test, expect, type Page } from '@playwright/test'

/**
 * Guards / conditions fixture coverage — exercises wrap({ conditions: […] })
 * with single, multi, async, short-circuit on first fail, and the detail
 * object the condition receives.
 *
 * Routes are defined in example/src/App.svelte; each condition pushes an entry
 * onto window.__guardCalls so the spec can verify call order.
 *
 * **Important contract:** plain wrap-conditions failure (no `permissions:`)
 * falls through to the router's `conditionsFailed` event path — the previous
 * component is cleared but no Unauthorized component is mounted. The spec
 * asserts the denied state by (a) absence of the protected heading and (b) a
 * `conditionsFailed` event recorded on window.__conditionsFailedEvents via
 * App.svelte's onConditionsFailed handler.
 *
 *   /test/guards/allow              [pass]
 *   /test/guards/deny               [fail]
 *   /test/guards/pass-then-fail     [pass, fail]
 *   /test/guards/fail-then-skip     [fail, would-pass]
 *   /test/guards/async-allow        [async pass]
 *   /test/guards/async-deny         [async fail]
 *   /test/guards/echo/:id           records `detail` (location, params)
 */

const FIXTURE = '/test/guards'

type GuardCall = { name: string; location?: string; params?: Record<string, string> }
type FailedEvent = { location?: string; route?: string }

async function gotoFixture(page: Page) {
    await page.goto(FIXTURE)
    // Wipe whatever earlier navigations recorded so each test sees a clean slate.
    await page.evaluate(() => {
        const w = window as unknown as { __guardCalls: GuardCall[]; __conditionsFailedEvents: FailedEvent[] }
        w.__guardCalls = []
        w.__conditionsFailedEvents = []
    })
}

async function readGuardCalls(page: Page): Promise<GuardCall[]> {
    return page.evaluate(() => (window as unknown as { __guardCalls: GuardCall[] }).__guardCalls)
}

async function readFailedEvents(page: Page): Promise<FailedEvent[]> {
    return page.evaluate(() => (window as unknown as { __conditionsFailedEvents: FailedEvent[] }).__conditionsFailedEvents)
}

async function expectAllowed(page: Page) {
    await expect(page.getByTestId('guarded-heading')).toHaveText('Guarded OK')
}

async function expectDenied(page: Page, route: string) {
    // Non-permission condition failure: the previous component is cleared but no
    // Unauthorized component is mounted. We verify by absence and by a recorded
    // onConditionsFailed event.
    await expect(page.getByTestId('guarded-heading')).toHaveCount(0)
    await expect.poll(() => readFailedEvents(page)).toContainEqual(
        expect.objectContaining({ location: route })
    )
}

test.describe('single condition', () => {
    test('returning true allows the route', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-allow').click()

        await expectAllowed(page)
        const calls = await readGuardCalls(page)
        expect(calls.map((c) => c.name)).toEqual(['allow'])
    })

    test('returning false fires onConditionsFailed and clears the route', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-deny').click()

        await expectDenied(page, '/test/guards/deny')
        const calls = await readGuardCalls(page)
        expect(calls.map((c) => c.name)).toEqual(['deny'])
    })
})

test.describe('multiple conditions', () => {
    test('[pass, fail] runs both and blocks (second condition is the one that fails)', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-pass-then-fail').click()

        await expectDenied(page, '/test/guards/pass-then-fail')
        const calls = await readGuardCalls(page)
        expect(calls.map((c) => c.name)).toEqual(['first-pass', 'then-fail'])
    })

    test('[fail, would-pass] short-circuits — the second condition is never called', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-fail-then-skip').click()

        await expectDenied(page, '/test/guards/fail-then-skip')
        const calls = await readGuardCalls(page)
        expect(calls.map((c) => c.name)).toEqual(['first-fail'])
        expect(calls.find((c) => c.name === 'should-not-run')).toBeUndefined()
    })
})

test.describe('async conditions', () => {
    test('async resolving true allows the route', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-async-allow').click()

        await expectAllowed(page)
        const calls = await readGuardCalls(page)
        expect(calls.map((c) => c.name)).toEqual(['async-allow'])
    })

    test('async resolving false fires onConditionsFailed and clears the route', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-async-deny').click()

        await expectDenied(page, '/test/guards/async-deny')
        const calls = await readGuardCalls(page)
        expect(calls.map((c) => c.name)).toEqual(['async-deny'])
    })
})

test.describe('condition `detail` argument', () => {
    test('receives location and params for the matched route', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-echo').click()

        await expectAllowed(page)
        await expect(page.getByTestId('guarded-id')).toHaveText('42')

        const calls = await readGuardCalls(page)
        const echo = calls.find((c) => c.name === 'echo')
        expect(echo).toBeDefined()
        expect(echo!.location).toBe('/test/guards/echo/42')
        expect(echo!.params).toMatchObject({ id: '42' })
    })
})
