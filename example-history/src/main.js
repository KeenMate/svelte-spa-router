import { mount } from 'svelte'
import { setHashRoutingEnabled, setBasePath } from '../../src/lib/utils.svelte.js'
import App from './App.svelte'

// Configure for history mode (non-hash routing)
setHashRoutingEnabled(false)
setBasePath(import.meta.env.BASE_URL || '/')

const app = mount(App, {
    target: document.body
})

export default app
