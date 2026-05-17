import { test, expect, type Page } from '@playwright/test'

/**
 * Permissions fixture coverage — exercises createProtectedRoute() (RBAC and
 * authorizationCallback paths) plus the hasPermission() UI helper against
 * example/src/routes/test/PermissionsTest.svelte + PermissionsProtected.svelte.
 *
 * The fixture reuses the example's userStore: Donna (read/write/user:view,
 * docs=[1]) ↔ Audrey (read/admin/user:view/user:edit/settings:manage, docs=[1,4]).
 * Each test starts as Donna (fresh module state per Playwright context); the
 * toggle button switches to Audrey.
 *
 * Routes:
 *   /test/perms                              — fixture index (always allowed)
 *   /test/perms/needs-read                   — permissions: any:[read]
 *   /test/perms/needs-admin                  — permissions: any:[admin]
 *   /test/perms/document/:id                 — authorizationCallback (per-doc)
 *
 * App-level unauthorizedBehavior is 'component' (see main.js/App.svelte), so a
 * denied check renders the Unauthorized component in place without changing
 * the URL. We use the "Access Denied" heading as the denied signal.
 */

const FIXTURE = '/test/perms'

async function gotoFixture(page: Page) {
    await page.goto(FIXTURE)
    await expect(page.getByTestId('user-name')).toHaveText('Donna Hayward')
}

async function expectAllowed(page: Page) {
    await expect(page.getByTestId('protected-heading')).toHaveText('Protected OK')
}

async function expectDenied(page: Page) {
    await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible()
    // Sanity: the protected component is NOT mounted.
    await expect(page.getByTestId('protected-heading')).toHaveCount(0)
}

test.describe('hasPermission()', () => {
    test('reflects the current user (Donna defaults)', async ({ page }) => {
        await gotoFixture(page)

        await expect(page.getByTestId('has-read')).toHaveText('true')
        await expect(page.getByTestId('has-admin')).toHaveText('false')
        await expect(page.getByTestId('has-read-and-admin')).toHaveText('false')
        await expect(page.getByTestId('has-read-and-user-view')).toHaveText('true')
    })

    test('updates reactively when the user changes (Donna → Audrey)', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('btn-toggle-user').click()

        await expect(page.getByTestId('user-name')).toHaveText('Audrey Horne')
        await expect(page.getByTestId('has-admin')).toHaveText('true')
        await expect(page.getByTestId('has-read-and-admin')).toHaveText('true')
    })
})

test.describe('createProtectedRoute — RBAC (any:[…])', () => {
    test('a route the user has permission for renders normally', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-needs-read').click()

        // Donna has 'read' → allowed.
        await expectAllowed(page)
    })

    test('a route the user lacks permission for renders the Unauthorized component', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-needs-admin').click()

        // Donna does NOT have 'admin' → denied.
        await expectDenied(page)
    })

    test('toggling user → Audrey unlocks the admin-only route', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('btn-toggle-user').click()
        await expect(page.getByTestId('user-name')).toHaveText('Audrey Horne')

        await page.getByTestId('link-needs-admin').click()
        await expectAllowed(page)
    })
})

test.describe('createProtectedRoute — authorizationCallback', () => {
    test('doc 1 is accessible to Donna (shared)', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-doc-1').click()

        await expectAllowed(page)
        await expect(page.getByTestId('protected-doc-id')).toHaveText('1')
    })

    test('doc 2 is denied for Donna (not in accessibleDocuments)', async ({ page }) => {
        await gotoFixture(page)
        await page.getByTestId('link-doc-2').click()

        await expectDenied(page)
    })

    test('doc 4 is denied for Donna but allowed for Audrey', async ({ page }) => {
        await gotoFixture(page)

        // Donna: denied.
        await page.getByTestId('link-doc-4').click()
        await expectDenied(page)

        // Navigate back, toggle user, retry.
        await page.goto(FIXTURE)
        await page.getByTestId('btn-toggle-user').click()
        await expect(page.getByTestId('user-name')).toHaveText('Audrey Horne')

        await page.getByTestId('link-doc-4').click()
        await expectAllowed(page)
        await expect(page.getByTestId('protected-doc-id')).toHaveText('4')
    })
})
