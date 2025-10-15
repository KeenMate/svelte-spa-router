import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
    plugins: [svelte()],
    server: {
        port: 5050,
        // Enable history API fallback for SPA routing
        // This ensures all routes serve index.html in development
        historyApiFallback: true
    }
})
