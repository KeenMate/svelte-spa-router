import { test, expect } from '@playwright/test'

/**
 * Filters fixture — exercises the structured filters mode (OData-style)
 * configured in main.js (paramName='$filter', custom parse/stringify for
 * "key eq 'value' AND key eq 'value'") against
 * example/src/routes/test/FiltersTest.svelte.
 */

test.describe('filters() reactive helper', () => {
    test('no $filter param → empty filters object', async ({ page }) => {
        await page.goto('/test/filters')
        await expect(page.getByTestId('filters-json')).toHaveText('{}')
        await expect(page.getByTestId('filters-count')).toHaveText('0')
    })

    test('single eq filter parses one key/value', async ({ page }) => {
        await page.goto('/test/filters')
        await page.getByTestId('link-single').click()

        await expect(page.getByTestId('filter-search')).toHaveText('java')
        await expect(page.getByTestId('filters-count')).toHaveText('1')
    })

    test('AND-chained filters parse into multiple keys', async ({ page }) => {
        await page.goto('/test/filters')
        await page.getByTestId('link-and').click()

        await expect(page.getByTestId('filter-search')).toHaveText('java')
        await expect(page.getByTestId('filter-category')).toHaveText('books')
        await expect(page.getByTestId('filters-count')).toHaveText('2')
    })
})

test.describe('updateFilters()', () => {
    test('updates the $filter querystring with a single value', async ({ page }) => {
        await page.goto('/test/filters')
        await page.getByTestId('btn-update-search').click()

        await expect(page.getByTestId('filter-search')).toHaveText('python')
        // The $ in $filter is URL-encoded as %24.
        await expect(page).toHaveURL(/%24filter=/)
        await expect(page).toHaveURL(/python/)
    })

    test('updates the $filter querystring with multiple values (AND-chained)', async ({ page }) => {
        await page.goto('/test/filters')
        await page.getByTestId('btn-update-multi').click()

        await expect(page.getByTestId('filter-search')).toHaveText('go')
        await expect(page.getByTestId('filter-category')).toHaveText('tools')
        await expect(page.getByTestId('filters-count')).toHaveText('2')
    })
})
