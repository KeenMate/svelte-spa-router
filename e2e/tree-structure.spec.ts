import { test, expect } from '@playwright/test'

/**
 * Tree structure fixture — exercises createHierarchy() against
 * example/src/routes/test/TreeStructureTest.svelte. The tree is built in
 * App.svelte and produces 3 flat routes with auto-registered named routes
 * (testTreeRoot, testTreeItem, testTreeItemLogs).
 *
 *   /test/tree              breadcrumbs=[Tree]                title='Tree Root'
 *   /test/tree/:id          breadcrumbs=[Tree, Item]          title='Tree Item'
 *   /test/tree/:id/logs     breadcrumbs=[Tree, Item, Logs]    title='Item Logs'
 */

test.describe('child-path concatenation', () => {
    test('the root path renders alone', async ({ page }) => {
        await page.goto('/test/tree')

        await expect(page.getByTestId('location')).toHaveText('/test/tree')
        await expect(page.getByTestId('title')).toHaveText('Tree Root')
        await expect(page.getByTestId('breadcrumbs-labels')).toHaveText('Tree')
        await expect(page.getByTestId('breadcrumbs-count')).toHaveText('1')
    })

    test('child path is concatenated under the parent (/test/tree + :id → /test/tree/:id)', async ({ page }) => {
        await page.goto('/test/tree/abc')

        await expect(page.getByTestId('location')).toHaveText('/test/tree/abc')
        await expect(page.getByTestId('route-params')).toContainText('"id":"abc"')
        await expect(page.getByTestId('title')).toHaveText('Tree Item')
    })

    test('grandchild path concatenates through the full chain', async ({ page }) => {
        await page.goto('/test/tree/abc/logs')

        await expect(page.getByTestId('location')).toHaveText('/test/tree/abc/logs')
        await expect(page.getByTestId('route-params')).toContainText('"id":"abc"')
        await expect(page.getByTestId('title')).toHaveText('Item Logs')
    })
})

test.describe('breadcrumb inheritance through the tree', () => {
    test('child inherits parent breadcrumbs (Tree → Item)', async ({ page }) => {
        await page.goto('/test/tree/abc')

        await expect(page.getByTestId('breadcrumbs-labels')).toHaveText('Tree > Item')
        await expect(page.getByTestId('breadcrumbs-count')).toHaveText('2')
    })

    test('grandchild inherits the full chain (Tree → Item → Logs)', async ({ page }) => {
        await page.goto('/test/tree/abc/logs')

        await expect(page.getByTestId('breadcrumbs-labels')).toHaveText('Tree > Item > Logs')
        await expect(page.getByTestId('breadcrumbs-count')).toHaveText('3')
    })
})

test.describe('auto-registered named routes', () => {
    test('push by the tree-defined name navigates to the resolved URL', async ({ page }) => {
        await page.goto('/test/tree')
        await page.getByTestId('btn-push-item').click()

        await expect(page.getByTestId('location')).toHaveText('/test/tree/xyz')
        await expect(page.getByTestId('route-params')).toContainText('"id":"xyz"')
    })

    test('deeply nested named route resolves via the full chain', async ({ page }) => {
        await page.goto('/test/tree')
        await page.getByTestId('btn-push-item-logs').click()

        await expect(page.getByTestId('location')).toHaveText('/test/tree/xyz/logs')
        await expect(page.getByTestId('breadcrumbs-labels')).toHaveText('Tree > Item > Logs')
    })
})
