import { test, expect, type Page } from '@playwright/test'

/**
 * /nav-tree-demo — tree-driven sidebar with permission filtering.
 *
 * Verifies the user-facing demo, not the helper itself (unit tests in
 * src/tests/nav-tree.test.js exercise filterByPermissions directly). The
 * point of this spec is that the wiring works end-to-end: filter runs inside
 * a `$derived`, user toggle triggers re-render, mode toggle swaps between
 * hide and disable, and forbidden items render as <span> (not <a>).
 *
 * The example app starts logged in as Donna (permissions: read, write,
 * user:view). Switching toggles to Audrey (admin + everything).
 *
 * Tree from `example/src/routes/nav-tree.js`:
 *   /nav-tree-demo                       public
 *   /nav-tree-demo/users                 user:view
 *     /users/list                        user:view
 *     /users/new                         user:edit (Audrey only)
 *     /users/123                         user:view
 *   /nav-tree-demo/admin                 admin (Audrey only)
 *     /admin/dashboard
 *     /admin/audit
 *   /nav-tree-demo/settings              settings:manage (Audrey only)
 *   /nav-tree-demo/labs                  isHidden: () => !DEV (visible in dev)
 *     /labs/beta-feature
 *   /nav-tree-demo/secret                isHidden: true (never)
 */

const DEMO = '/nav-tree-demo'

async function gotoDemo(page: Page) {
    await page.goto(DEMO)
    await expect(page.locator('aside.sidebar')).toBeVisible()
}

async function ensureUser(page: Page, name: 'Donna Hayward' | 'Audrey Horne') {
    const userLabel = page.locator('aside.sidebar .user')
    const current = (await userLabel.textContent())?.trim()
    if (current !== name) {
        await page.locator('aside.sidebar .controls button').click()
        await expect(userLabel).toHaveText(name)
    }
}

async function setMode(page: Page, mode: 'hide' | 'disable') {
    await page.locator(`aside.sidebar .controls input[value="${mode}"]`).check()
}

test.describe('nav-tree-demo — Donna (limited permissions)', () => {
    test('hide mode: only accessible items render; Admin and Settings sections gone', async ({ page }) => {
        await gotoDemo(page)
        await ensureUser(page, 'Donna Hayward')
        await setMode(page, 'hide')

        const nav = page.locator('aside.sidebar nav')

        // Visible
        await expect(nav.locator('a', { hasText: /^Overview$/ })).toBeVisible()
        await expect(nav.locator('a', { hasText: /^Users$/ })).toBeVisible()
        await expect(nav.locator('a', { hasText: /^All users$/ })).toBeVisible()
        await expect(nav.locator('a', { hasText: /^User 123$/ })).toBeVisible()
        // Labs is dev-only — but dev server IS what Playwright runs against,
        // so it must be visible.
        await expect(nav.locator('a', { hasText: /^Labs$/ })).toBeVisible()

        // Hidden (permission)
        await expect(nav.locator('a', { hasText: /^Create user$/ })).toHaveCount(0)
        await expect(nav.locator('a', { hasText: /^Admin$/ })).toHaveCount(0)
        await expect(nav.locator('a', { hasText: /^Settings$/ })).toHaveCount(0)

        // Always hidden
        await expect(nav.locator('a', { hasText: /^Secret ops$/ })).toHaveCount(0)
        await expect(nav.locator('span', { hasText: /^Secret ops$/ })).toHaveCount(0)
    })

    test('disable mode: forbidden items render as <span class="forbidden">, not links', async ({ page }) => {
        await gotoDemo(page)
        await ensureUser(page, 'Donna Hayward')
        await setMode(page, 'disable')

        const nav = page.locator('aside.sidebar nav')

        // Admin is forbidden — rendered as <span> with the forbidden class.
        // (Casting under <nav>'s scoped class — match by class substring.)
        const adminSpan = nav.locator('span').filter({ hasText: /^Admin$/ })
        await expect(adminSpan).toBeVisible()
        await expect(adminSpan).toHaveAttribute('aria-disabled', 'true')
        await expect(adminSpan).toHaveClass(/forbidden/)

        // No <a> for Admin — confirms it's not a link
        await expect(nav.locator('a', { hasText: /^Admin$/ })).toHaveCount(0)

        // Settings forbidden too
        const settingsSpan = nav.locator('span').filter({ hasText: /^Settings$/ })
        await expect(settingsSpan).toHaveClass(/forbidden/)

        // Create user forbidden
        const createSpan = nav.locator('span').filter({ hasText: /^Create user$/ })
        await expect(createSpan).toHaveClass(/forbidden/)

        // Secret ops still hidden (isHidden takes precedence even in disable mode)
        await expect(nav.locator('span').filter({ hasText: /^Secret ops$/ })).toHaveCount(0)
    })
})

test.describe('nav-tree-demo — Audrey (full permissions)', () => {
    test('hide mode: every gated section becomes visible after user switch', async ({ page }) => {
        await gotoDemo(page)
        await ensureUser(page, 'Audrey Horne')
        await setMode(page, 'hide')

        const nav = page.locator('aside.sidebar nav')
        await expect(nav.locator('a', { hasText: /^Admin$/ })).toBeVisible()
        await expect(nav.locator('a', { hasText: /^Settings$/ })).toBeVisible()
        await expect(nav.locator('a', { hasText: /^Create user$/ })).toBeVisible()
    })

    test('disable mode: nothing is forbidden for the full-access user', async ({ page }) => {
        await gotoDemo(page)
        await ensureUser(page, 'Audrey Horne')
        await setMode(page, 'disable')

        const nav = page.locator('aside.sidebar nav')
        await expect(nav.locator('span.forbidden')).toHaveCount(0)
    })
})

test.describe('nav-tree-demo — live reactivity', () => {
    test('toggling user triggers sidebar re-filter without a page reload', async ({ page }) => {
        await gotoDemo(page)
        await ensureUser(page, 'Donna Hayward')
        await setMode(page, 'hide')

        const nav = page.locator('aside.sidebar nav')
        await expect(nav.locator('a', { hasText: /^Admin$/ })).toHaveCount(0)

        // Sentinel: prove there's no full page reload
        await page.evaluate(() => { (window as unknown as { __sentinel: boolean }).__sentinel = true })

        await page.locator('aside.sidebar .controls button').click()
        await expect(page.locator('aside.sidebar .user')).toHaveText('Audrey Horne')

        // Admin should now appear
        await expect(nav.locator('a', { hasText: /^Admin$/ })).toBeVisible()

        const survived = await page.evaluate(
            () => (window as unknown as { __sentinel?: boolean }).__sentinel === true
        )
        expect(survived).toBe(true)
    })

    test('mode toggle swaps hide → disable behavior in place', async ({ page }) => {
        await gotoDemo(page)
        await ensureUser(page, 'Donna Hayward')

        const nav = page.locator('aside.sidebar nav')

        // Hide: Admin is gone entirely
        await setMode(page, 'hide')
        await expect(nav.locator('a', { hasText: /^Admin$/ })).toHaveCount(0)
        await expect(nav.locator('span').filter({ hasText: /^Admin$/ })).toHaveCount(0)

        // Disable: Admin reappears as forbidden span
        await setMode(page, 'disable')
        await expect(nav.locator('span').filter({ hasText: /^Admin$/ })).toHaveClass(/forbidden/)
    })
})

test.describe('nav-tree-demo — feature-flag toggle (runtime-reactive isHidden)', () => {
    test('Preview features is hidden by default and appears when toggled on', async ({ page }) => {
        await gotoDemo(page)
        await ensureUser(page, 'Audrey Horne')   // full permissions so no other gates interfere
        await setMode(page, 'hide')

        const nav = page.locator('aside.sidebar nav')
        const preview = nav.locator('a').filter({ hasText: /^Preview features$/ })

        // Default: flags.showNewFeatures === false → hidden
        await expect(preview).toHaveCount(0)

        // Flip the checkbox — the isHidden getter reads the flag at filter
        // time, so the whole branch should appear with no page reload.
        await page.evaluate(() => { (window as unknown as { __sentinel: boolean }).__sentinel = true })
        await page.getByTestId('toggle-new-features').click()

        await expect(preview).toBeVisible()
        // Children also visible (they inherit nothing special; the parent's
        // hidden state was the only thing blocking them).
        await expect(nav.locator('a').filter({ hasText: /^AI Assistant$/ })).toBeVisible()
        await expect(nav.locator('a').filter({ hasText: /^Dashboard v2$/ })).toBeVisible()

        const survived = await page.evaluate(
            () => (window as unknown as { __sentinel?: boolean }).__sentinel === true
        )
        expect(survived).toBe(true)

        // Flip back — section vanishes again
        await page.getByTestId('toggle-new-features').click()
        await expect(preview).toHaveCount(0)
    })

    test('toggle works in disable mode too — isHidden takes precedence over mode', async ({ page }) => {
        await gotoDemo(page)
        await ensureUser(page, 'Audrey Horne')
        await setMode(page, 'disable')

        const nav = page.locator('aside.sidebar nav')
        const preview = nav.locator('a').filter({ hasText: /^Preview features$/ })
        const previewSpan = nav.locator('span').filter({ hasText: /^Preview features$/ })

        // Default off: neither <a> nor <span> appears — isHidden is always-destructive
        await expect(preview).toHaveCount(0)
        await expect(previewSpan).toHaveCount(0)

        // Toggle on: appears as a link (Audrey has access, no permission gate)
        await page.getByTestId('toggle-new-features').click()
        await expect(preview).toBeVisible()
    })
})

test.describe('nav-tree-demo — active highlighting still works on filtered items', () => {
    test('navigating to a permitted descendant highlights the parent', async ({ page }) => {
        // Donna can see Users → User 123. Navigate there; parent should get
        // .sublink-active.
        await page.goto(`${DEMO}/users/123`)
        await ensureUser(page, 'Donna Hayward')

        const nav = page.locator('aside.sidebar nav')
        const usersParent = nav.locator('a', { hasText: /^Users$/ })
        await expect(usersParent).toHaveClass(/sublink-active/)

        const userDetail = nav.locator('a', { hasText: /^User 123$/ })
        await expect(userDetail).toHaveClass(/link-active/)
    })
})
