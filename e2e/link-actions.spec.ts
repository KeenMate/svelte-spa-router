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

/**
 * Sidebar with submenu — codifies the regexparam wildcard quirk:
 *   `use:active={'/foo/*'}` does NOT match bare `/foo`.
 *
 * The fixture renders five parent-link variants pointing at the same href so
 * we can directly compare highlight behavior across URL depths:
 *
 *   sb-parent-users-exact        → use:active (no arg)              — matches href exactly
 *   sb-parent-users-prefix       → use:active={'/sidebar/users/*'}  — descendants only
 *   sb-parent-users-regex        → use:active={/^\/users(\/|$)/}    — branch active (recommended)
 *   sb-parent-users-double       → use:active use:active={'/sidebar/users/*'} — stacked branch active
 *   sb-parent-users-branch-only  → use:active={{ path: <regex>, className: 'branch-active' }}
 *
 * The "stacked" variant requires aggregate class management in active.svelte.js
 * (a class is present iff ANY entry's pattern matches). An earlier per-entry
 * remove-then-maybe-add was order-dependent and let the last action strip a
 * class the previous one added; both the library fix and this assertion landed
 * in the same change.
 */
const SIDEBAR_ROOT = '/test/links/sidebar'
const SB_USERS = '/test/links/sidebar/users'
const SB_USERS_LIST = '/test/links/sidebar/users/list'
const SB_USERS_123 = '/test/links/sidebar/users/123'
const SB_USERS_123_EDIT = '/test/links/sidebar/users/123/edit'

const ACTIVE_RE = /(^|\s)active(\s|$)/
const BRANCH_RE = /(^|\s)branch-active(\s|$)/

type ParentExpectation = {
    exact: boolean
    prefix: boolean
    regex: boolean
    double: boolean
    branchOnly: boolean
}

// Truth table per URL. `exact` = default (no arg) → highlights only when the
// link's href EQUALS the current location. All parent variants share the same
// href `/sidebar/users`, so `exact` is on iff URL == that.
const SIDEBAR_MATRIX: Array<{ url: string; expect: ParentExpectation }> = [
    { url: SIDEBAR_ROOT,      expect: { exact: false, prefix: false, regex: false, double: false, branchOnly: false } },
    { url: SB_USERS,          expect: { exact: true,  prefix: false, regex: true,  double: true,  branchOnly: true  } },
    { url: SB_USERS_LIST,     expect: { exact: false, prefix: true,  regex: true,  double: true,  branchOnly: true  } },
    { url: SB_USERS_123,      expect: { exact: false, prefix: true,  regex: true,  double: true,  branchOnly: true  } },
    { url: SB_USERS_123_EDIT, expect: { exact: false, prefix: true,  regex: true,  double: true,  branchOnly: true  } }
]

async function expectActive(page: Page, testid: string, expected: boolean, classRe = ACTIVE_RE) {
    const el = page.getByTestId(testid)
    if (expected) {
        await expect(el, `${testid} should be active`).toHaveClass(classRe)
    } else {
        await expect(el, `${testid} should NOT be active`).not.toHaveClass(classRe)
    }
}

test.describe('use:active — sidebar with submenu', () => {
    test('regexparam quirk: bare /users does NOT match /users/* but DOES match the regex/stacked variants', async ({ page }) => {
        // Headline assertion — the whole sidebar fixture exists to codify
        // this. See ai/link-actions.txt "PREFIX MATCHING — DESCENDANTS ONLY".
        await page.goto(SB_USERS)
        await expect(page.getByTestId('location')).toHaveText(SB_USERS)

        // /sidebar/users/* compiles to /^\/sidebar\/users\/(.*)\/?$/i — the
        // trailing slash after "users" is mandatory, so bare /users falls
        // through.
        await expectActive(page, 'sb-parent-users-prefix', false)

        // Regex ^\/sidebar\/users(\/|$) covers bare path too.
        await expectActive(page, 'sb-parent-users-regex', true)

        // Stacked: two use:active calls (default + prefix). Works thanks to
        // aggregate class management in active.svelte.js — the default action
        // adds 'active' on the exact href, the prefix action keeps it on
        // descendants, and neither strips what the other added.
        await expectActive(page, 'sb-parent-users-double', true)

        // Default (no arg) uses the link's href = /sidebar/users, so it
        // matches the current URL exactly.
        await expectActive(page, 'sb-parent-users-exact', true)

        // branch-only variant uses className: 'branch-active', not 'active'.
        await expectActive(page, 'sb-parent-users-branch-only', true, BRANCH_RE)
        await expectActive(page, 'sb-parent-users-branch-only', false)  // never 'active'
    })

    for (const { url, expect: exp } of SIDEBAR_MATRIX) {
        test(`parent variants at ${url}`, async ({ page }) => {
            await page.goto(url)
            await expect(page.getByTestId('location')).toHaveText(url)

            await expectActive(page, 'sb-parent-users-exact', exp.exact)
            await expectActive(page, 'sb-parent-users-prefix', exp.prefix)
            await expectActive(page, 'sb-parent-users-regex', exp.regex)
            await expectActive(page, 'sb-parent-users-double', exp.double)
            // branch-only variant uses className: 'branch-active' — never
            // gets the default 'active' class.
            await expectActive(page, 'sb-parent-users-branch-only', false)
            await expectActive(page, 'sb-parent-users-branch-only', exp.branchOnly, BRANCH_RE)
        })
    }

    test('child links: default use:active matches only the exact href', async ({ page }) => {
        // On /sidebar/users/list, only the "All users" child should light up.
        await page.goto(SB_USERS_LIST)
        await expectActive(page, 'sb-child-users-list', true)
        await expectActive(page, 'sb-child-users-detail', false)
        await expectActive(page, 'sb-child-users-edit', false)

        // Navigate to a different child via SPA click — exactly one child
        // active class should flip without a page reload.
        await page.evaluate(() => { (window as unknown as { __sentinel: boolean }).__sentinel = true })
        await page.getByTestId('sb-child-users-detail').click()
        await expect(page.getByTestId('location')).toHaveText(SB_USERS_123)

        await expectActive(page, 'sb-child-users-list', false)
        await expectActive(page, 'sb-child-users-detail', true)
        await expectActive(page, 'sb-child-users-edit', false)

        const survived = await page.evaluate(
            () => (window as unknown as { __sentinel?: boolean }).__sentinel === true
        )
        expect(survived).toBe(true)
    })

    test('grandchild: parent branch variants stay active two levels deep', async ({ page }) => {
        await page.goto(SB_USERS_123_EDIT)
        await expect(page.getByTestId('location')).toHaveText(SB_USERS_123_EDIT)

        // Bare-path parent (exact) drops out on grandchild URL...
        await expectActive(page, 'sb-parent-users-exact', false)
        // ...but every "branch" variant should still be lit.
        await expectActive(page, 'sb-parent-users-prefix', true)
        await expectActive(page, 'sb-parent-users-regex', true)
        await expectActive(page, 'sb-parent-users-double', true)
        await expectActive(page, 'sb-parent-users-branch-only', true, BRANCH_RE)

        // And only the matching child highlights.
        await expectActive(page, 'sb-child-users-list', false)
        await expectActive(page, 'sb-child-users-detail', false)
        await expectActive(page, 'sb-child-users-edit', true)
    })

    test('outside the branch: no parent variant highlights on the sidebar root', async ({ page }) => {
        await page.goto(SIDEBAR_ROOT)
        await expect(page.getByTestId('location')).toHaveText(SIDEBAR_ROOT)

        await expectActive(page, 'sb-parent-users-exact', false)
        await expectActive(page, 'sb-parent-users-prefix', false)
        await expectActive(page, 'sb-parent-users-regex', false)
        await expectActive(page, 'sb-parent-users-double', false)
        await expectActive(page, 'sb-parent-users-branch-only', false, BRANCH_RE)

        // The "back to sidebar root" link IS active here (default match on
        // its own href).
        await expectActive(page, 'sb-link-root', true)
    })
})

/**
 * Two-class parent/child pattern — distinguishes "really active" from
 * "parent of an active descendant" by giving the parent two use:active
 * actions with different classNames:
 *
 *   { className: 'link-active' }                 — default path = href, exact match
 *   { path: '/users/*', className: 'sublink-active' } — descendants only
 *
 * Children get a single `use:active={{ className: 'link-active' }}`.
 *
 * Expected per URL (parent links and three children share the testid prefix sb-tc-):
 *
 *   URL                          | parent.link-active | parent.sublink-active | child.link-active (which?)
 *   -----------------------------+--------------------+-----------------------+---------------------------
 *   /sidebar                     | -                  | -                     | none
 *   /sidebar/users               | YES                | -                     | none
 *   /sidebar/users/list          | -                  | YES                   | list
 *   /sidebar/users/123           | -                  | YES                   | detail
 *   /sidebar/users/123/edit      | -                  | YES                   | edit
 */
const LINK_ACTIVE_RE = /(^|\s)link-active(\s|$)/
const SUBLINK_ACTIVE_RE = /(^|\s)sublink-active(\s|$)/

test.describe('use:active — two-class parent/child pattern', () => {
    test('on bare /users: parent gets link-active, not sublink-active', async ({ page }) => {
        await page.goto(SB_USERS)
        await expect(page.getByTestId('location')).toHaveText(SB_USERS)

        await expectActive(page, 'sb-tc-parent-users', true, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-parent-users', false, SUBLINK_ACTIVE_RE)

        // No children active (URL doesn't match any child's exact href)
        await expectActive(page, 'sb-tc-child-list', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-detail', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-edit', false, LINK_ACTIVE_RE)
    })

    test('on /users/list: parent gets sublink-active, list child gets link-active', async ({ page }) => {
        await page.goto(SB_USERS_LIST)
        await expect(page.getByTestId('location')).toHaveText(SB_USERS_LIST)

        await expectActive(page, 'sb-tc-parent-users', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-parent-users', true, SUBLINK_ACTIVE_RE)

        await expectActive(page, 'sb-tc-child-list', true, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-detail', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-edit', false, LINK_ACTIVE_RE)
    })

    test('on /users/123: parent gets sublink-active, detail child gets link-active', async ({ page }) => {
        await page.goto(SB_USERS_123)
        await expect(page.getByTestId('location')).toHaveText(SB_USERS_123)

        await expectActive(page, 'sb-tc-parent-users', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-parent-users', true, SUBLINK_ACTIVE_RE)

        await expectActive(page, 'sb-tc-child-list', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-detail', true, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-edit', false, LINK_ACTIVE_RE)
    })

    test('on /users/123/edit (grandchild): parent stays sublink-active, edit child gets link-active', async ({ page }) => {
        await page.goto(SB_USERS_123_EDIT)
        await expect(page.getByTestId('location')).toHaveText(SB_USERS_123_EDIT)

        await expectActive(page, 'sb-tc-parent-users', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-parent-users', true, SUBLINK_ACTIVE_RE)

        await expectActive(page, 'sb-tc-child-list', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-detail', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-edit', true, LINK_ACTIVE_RE)
    })

    test('on sidebar root: nothing highlights', async ({ page }) => {
        await page.goto(SIDEBAR_ROOT)
        await expect(page.getByTestId('location')).toHaveText(SIDEBAR_ROOT)

        await expectActive(page, 'sb-tc-parent-users', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-parent-users', false, SUBLINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-list', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-detail', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-edit', false, LINK_ACTIVE_RE)
    })

    test('SPA navigation flips classes cleanly', async ({ page }) => {
        // Start at /users/list — parent has sublink-active, list child has link-active.
        await page.goto(SB_USERS_LIST)
        await expectActive(page, 'sb-tc-parent-users', true, SUBLINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-list', true, LINK_ACTIVE_RE)

        // Click into /users/123 — list child loses link-active, detail child gains it.
        // Parent stays sublink-active throughout.
        await page.getByTestId('sb-tc-child-detail').click()
        await expect(page.getByTestId('location')).toHaveText(SB_USERS_123)
        await expectActive(page, 'sb-tc-parent-users', true, SUBLINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-parent-users', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-list', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-child-detail', true, LINK_ACTIVE_RE)

        // Navigate back to bare /users — parent flips to link-active, sublink-active off.
        await page.goto(SB_USERS)
        await expectActive(page, 'sb-tc-parent-users', true, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-tc-parent-users', false, SUBLINK_ACTIVE_RE)
    })
})

/**
 * Subtree option — high-level shortcut that replaces the stacked-actions
 * boilerplate. `use:active={{ subtree: true }}` internally registers an
 * exact match on the link's href AND a `/href/*` descendants pattern.
 *
 * Targets fixture testids:
 *   sb-st-parent-single     — { subtree: true }                          → single class 'active'
 *   sb-st-parent-two-class  — { subtree: true, className, subtreeClassName } → 'link-active' on exact, 'sublink-active' on descendants
 *   sb-st-child-list, sb-st-child-detail — children w/ exact match link-active
 */
test.describe('use:active — subtree option', () => {
    test('subtree:true matches the exact href (single class variant)', async ({ page }) => {
        await page.goto(SB_USERS)
        await expectActive(page, 'sb-st-parent-single', true, ACTIVE_RE)
    })

    test('subtree:true matches descendants (single class variant)', async ({ page }) => {
        await page.goto(SB_USERS_LIST)
        await expectActive(page, 'sb-st-parent-single', true, ACTIVE_RE)

        await page.goto(SB_USERS_123)
        await expectActive(page, 'sb-st-parent-single', true, ACTIVE_RE)

        await page.goto(SB_USERS_123_EDIT)
        await expectActive(page, 'sb-st-parent-single', true, ACTIVE_RE)
    })

    test('subtree:true does not match unrelated URLs', async ({ page }) => {
        await page.goto(SIDEBAR_ROOT)
        await expectActive(page, 'sb-st-parent-single', false, ACTIVE_RE)
    })

    test('subtreeClassName: exact href uses className, descendants use subtreeClassName', async ({ page }) => {
        // On bare /users: only link-active should be present
        await page.goto(SB_USERS)
        await expectActive(page, 'sb-st-parent-two-class', true, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-st-parent-two-class', false, SUBLINK_ACTIVE_RE)

        // On /users/list: only sublink-active
        await page.goto(SB_USERS_LIST)
        await expectActive(page, 'sb-st-parent-two-class', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-st-parent-two-class', true, SUBLINK_ACTIVE_RE)

        // Grandchild /users/123/edit: still only sublink-active
        await page.goto(SB_USERS_123_EDIT)
        await expectActive(page, 'sb-st-parent-two-class', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-st-parent-two-class', true, SUBLINK_ACTIVE_RE)
    })

    test('children with single use:active still get link-active on exact match', async ({ page }) => {
        await page.goto(SB_USERS_LIST)
        await expectActive(page, 'sb-st-child-list', true, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-st-child-detail', false, LINK_ACTIVE_RE)

        await page.goto(SB_USERS_123)
        await expectActive(page, 'sb-st-child-list', false, LINK_ACTIVE_RE)
        await expectActive(page, 'sb-st-child-detail', true, LINK_ACTIVE_RE)
    })
})
