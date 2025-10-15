import { mount } from 'svelte'
import { setHashRoutingEnabled, setBasePath } from '../../src/lib/utils.svelte.js'
import { configureQuerystring } from '../../src/lib/helpers/querystring.svelte.js'
import { configureFilters } from '../../src/lib/helpers/filters.svelte.js'
import App from './App.svelte'

// Configure for history mode (non-hash routing)
setHashRoutingEnabled(false)
setBasePath(import.meta.env.BASE_URL || '/')

// Configure querystring parsing for the whole app
// Use 'auto' to automatically detect format, or specify 'comma' or 'repeat'
configureQuerystring({
    arrayFormat: 'auto'  // Auto-detect format from URL
})

// Configure filters system
// Use 'flat' for separate query parameters (default)
// Use 'structured' for OData-style single filter parameter
configureFilters({
    mode: 'flat'  // Flat mode: ?search=java&category=books
    // For structured mode:
    // mode: 'structured',
    // paramName: '$filter',
    // parse: (str) => parseODataFilter(str),
    // stringify: (obj) => stringifyODataFilter(obj)
})

const app = mount(App, {
    target: document.body
})

export default app
