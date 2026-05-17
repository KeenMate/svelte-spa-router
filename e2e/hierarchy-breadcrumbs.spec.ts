import { test, expect, type Page } from '@playwright/test'

/**
 * Hierarchy + breadcrumbs fixture — exercises routeTitle(), routeBreadcrumbs(),
 * automatic parent-breadcrumb inheritance (hierarchical mode is enabled in
 * main.js), and updateBreadcrumb() for dynamic-segment updates.
 *
 * Routes (each wrap({...}) with title + breadcrumbs):
 *   /test/meta              title='Meta'         breadcrumbs=[Home, Meta]
 *   /test/meta/items        title='Items'        breadcrumbs=[Items]            (inherits Home, Meta)
 *   /test/meta/items/:id    title='Item Detail'  breadcrumbs=[{id:'itemDetail', Loading...}] (inherits Home, Meta, Items)
 *
 * The fixture surfaces:
 *   title, breadcrumbs-count, breadcrumbs-labels (joined " > "), breadcrumbs-json
 *   btn-update-breadcrumb → updateBreadcrumb('itemDetail', { label: 'Real Item', … })
 */

const ROOT = '/test/meta'
const ITEMS = '/test/meta/items'
const ITEM_DETAIL = '/test/meta/items/abc'

test.describe('flat breadcrumbs on the root fixture route', () => {
    test('routeTitle() and routeBreadcrumbs() reflect the wrap() metadata', async ({ page }) => {
        await page.goto(ROOT)

        await expect(page.getByTestId('title')).toHaveText('Meta')
        await expect(page.getByTestId('breadcrumbs-count')).toHaveText('2')
        await expect(page.getByTestId('breadcrumbs-labels')).toHaveText('Home > Meta')
    })
})

test.describe('hierarchical inheritance (parent → child)', () => {
    test('child route inherits parent breadcrumbs and appends its own', async ({ page }) => {
        await page.goto(ITEMS)

        await expect(page.getByTestId('title')).toHaveText('Items')
        await expect(page.getByTestId('breadcrumbs-labels')).toHaveText('Home > Meta > Items')
        await expect(page.getByTestId('breadcrumbs-count')).toHaveText('3')
    })

    test('grandchild inherits the full chain (Home → Meta → Items → Loading…)', async ({ page }) => {
        await page.goto(ITEM_DETAIL)

        await expect(page.getByTestId('title')).toHaveText('Item Detail')
        await expect(page.getByTestId('breadcrumbs-labels')).toHaveText('Home > Meta > Items > Loading...')
        await expect(page.getByTestId('breadcrumbs-count')).toHaveText('4')
    })
})

test.describe('updateBreadcrumb(id, updates)', () => {
    test('replaces a breadcrumb by id on the current route', async ({ page }) => {
        await page.goto(ITEM_DETAIL)
        await expect(page.getByTestId('breadcrumbs-labels')).toHaveText('Home > Meta > Items > Loading...')

        await page.getByTestId('btn-update-breadcrumb').click()

        await expect(page.getByTestId('breadcrumbs-labels')).toHaveText('Home > Meta > Items > Real Item')
        // The non-updated breadcrumbs (the inherited chain) are unchanged.
        await expect(page.getByTestId('breadcrumbs-count')).toHaveText('4')
    })
})
