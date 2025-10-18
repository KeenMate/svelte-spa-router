import { mount } from 'svelte'
import { setHashRoutingEnabled, setBasePath } from '@keenmate/svelte-spa-router/utils'
import { configureQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring'
import { configureFilters } from '@keenmate/svelte-spa-router/helpers/filters'
import App from './App.svelte'

// Configure routing mode based on environment variable
// VITE_ROUTING_MODE can be 'hash' or 'history' (default: 'history')
const routingMode = import.meta.env.VITE_ROUTING_MODE || 'history'
setHashRoutingEnabled(routingMode === 'hash')
setBasePath(import.meta.env.BASE_URL || '/')

// Configure querystring parsing for the whole app
// Use 'auto' to automatically detect format, or specify 'comma' or 'repeat'
configureQuerystring({
    arrayFormat: 'auto'  // Auto-detect format from URL
})

// Configure filters system in structured mode (OData-style)
// This demonstrates the more advanced single-parameter filter format
configureFilters({
    mode: 'structured',
    paramName: '$filter',
    parse: (filterString) => {
        if (!filterString) return {}

        // Parse "search eq 'java' AND category eq 'books'" format
        const parts = filterString.split(' AND ').map(p => p.trim())
        const result = {}

        parts.forEach(part => {
            const match = part.match(/^(\w+)\s+eq\s+'([^']*)'$/)
            if (match) {
                const [, field, value] = match
                result[field] = value
            }
        })

        return result
    },
    stringify: (filters) => {
        // Convert object to OData filter string
        const parts = Object.entries(filters)
            .filter(([, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => `${k} eq '${v}'`)

        return parts.length > 0 ? parts.join(' AND ') : ''
    }
})

const app = mount(App, {
    target: document.body
})

export default app
