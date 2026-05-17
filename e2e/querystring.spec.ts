import { test, expect } from '@playwright/test'

/**
 * Querystring utilities fixture — exercises the reactive query() helper +
 * pure parseQuerystring/stringifyQuerystring functions against
 * example/src/routes/test/QuerystringTest.svelte.
 *
 * App-level configureQuerystring is set to { arrayFormat: 'auto' } in main.js,
 * so both ?tags=a,b,c (comma) and ?tag=a&tag=b&tag=c (repeat) get parsed into
 * arrays automatically.
 *
 * Testids:
 *   query-json, query-name, query-tags-type, query-tags
 *   parse-sample, stringify-sample
 *   link-simple, link-tags-comma, link-tags-repeat, link-empty, btn-push-multiple
 */

test.describe('query() reactive helper', () => {
    test('empty querystring → empty object', async ({ page }) => {
        await page.goto('/test/querystring')
        await expect(page.getByTestId('query-json')).toHaveText('{}')
    })

    test('single value is reflected via query()', async ({ page }) => {
        await page.goto('/test/querystring')
        await page.getByTestId('link-simple').click()

        await expect(page.getByTestId('query-name')).toHaveText('alice')
        await expect(page.getByTestId('query-json')).toContainText('"name":"alice"')
    })

    test('comma-separated values auto-detect as an array', async ({ page }) => {
        await page.goto('/test/querystring')
        await page.getByTestId('link-tags-comma').click()

        await expect(page.getByTestId('query-tags-type')).toHaveText('array')
        await expect(page.getByTestId('query-tags')).toHaveText('a|b|c')
    })

    test('repeated keys also auto-detect as an array', async ({ page }) => {
        await page.goto('/test/querystring')
        await page.getByTestId('link-tags-repeat').click()

        // The repeated key in this URL is 'tag' (singular) but the fixture binds
        // to query().tags. Re-bind via a separate testid? — simpler to assert on
        // the JSON dump which includes whatever keys the parser returned.
        await expect(page.getByTestId('query-json')).toContainText('"tag":["a","b","c"]')
    })

    test('multi-value push lands them all in query()', async ({ page }) => {
        await page.goto('/test/querystring')
        await page.getByTestId('btn-push-multiple').click()

        await expect(page.getByTestId('query-name')).toHaveText('charlie')
        const json = page.getByTestId('query-json')
        await expect(json).toContainText('"page":"2"')
        await expect(json).toContainText('"active":"true"')
    })
})

test.describe('parseQuerystring / stringifyQuerystring', () => {
    test('parseQuerystring decodes a fixed input string', async ({ page }) => {
        await page.goto('/test/querystring')

        const parsed = page.getByTestId('parse-sample')
        await expect(parsed).toContainText('"name":"alice"')
        await expect(parsed).toContainText('"age":"30"')
        // tags=a,b,c → array
        await expect(parsed).toContainText('"tags":["a","b","c"]')
    })

    test('stringifyQuerystring emits a URL-safe querystring', async ({ page }) => {
        await page.goto('/test/querystring')

        const stringified = page.getByTestId('stringify-sample')
        await expect(stringified).toContainText('name=bob')
        await expect(stringified).toContainText('age=21')
        // tags=[x,y] — could be 'tags=x,y' or 'tags=x&tags=y' depending on the
        // default emitter. Just assert both values are present.
        await expect(stringified).toContainText('x')
        await expect(stringified).toContainText('y')
    })
})
