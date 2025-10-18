import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
    plugins: [
        svelte({
            compilerOptions: {
                // Svelte 5 runes mode
                runes: true
            }
        })
    ],
    server: {
        port: 5050
    },
    // Vite automatically handles SPA fallback in dev mode
    // For production, you need server configuration (nginx, Apache, etc.)
    preview: {
        port: 5050
    }
})
