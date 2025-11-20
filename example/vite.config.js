import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'fs'

// Read package.json for build-time constants
const pkg = JSON.parse(readFileSync('../package.json', 'utf-8'))

export default defineConfig({
    plugins: [
        svelte({
            compilerOptions: {
                // Svelte 5 runes mode
                runes: true
            }
        })
    ],
    define: {
        '__VERSION__': JSON.stringify(pkg.version),
        '__PACKAGE_NAME__': JSON.stringify(pkg.name),
        '__AUTHOR__': JSON.stringify(pkg.author),
        '__LICENSE__': JSON.stringify(pkg.license),
        '__REPOSITORY__': JSON.stringify(pkg.repository?.url || pkg.repository || ''),
        '__HOMEPAGE__': JSON.stringify(pkg.homepage || '')
    },
    server: {
        port: 5050
    },
    // Vite automatically handles SPA fallback in dev mode
    // For production, you need server configuration (nginx, Apache, etc.)
    preview: {
        port: 5050
    }
})
