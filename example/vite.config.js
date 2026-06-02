import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync, existsSync } from 'fs'

// Read package.json for build-time constants
// Try multiple locations to support both local dev and Docker builds
let pkg
try {
    // Local development: parent directory
    if (existsSync('../package.json')) {
        pkg = JSON.parse(readFileSync('../package.json', 'utf-8'))
    }
    // Docker build: /router-src directory
    else if (existsSync('/router-src/package.json')) {
        pkg = JSON.parse(readFileSync('/router-src/package.json', 'utf-8'))
    }
    // Fallback: use default values
    else {
        pkg = {
            version: '5.1.0',
            name: '@keenmate/svelte-spa-router',
            author: 'KeenMate (https://keenmate.com)',
            license: 'MIT',
            repository: { url: 'https://github.com/keenmate/svelte-spa-router' },
            homepage: 'https://github.com/keenmate/svelte-spa-router#readme'
        }
    }
} catch (error) {
    console.warn('Failed to read package.json, using fallback values:', error.message)
    pkg = {
        version: '5.1.0',
        name: '@keenmate/svelte-spa-router',
        author: 'KeenMate (https://keenmate.com)',
        license: 'MIT',
        repository: { url: 'https://github.com/keenmate/svelte-spa-router' },
        homepage: 'https://github.com/keenmate/svelte-spa-router#readme'
    }
}

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
    css: {
        preprocessorOptions: {
            scss: {
                // Use Sass's modern compiler API. Without this, Vite invokes
                // sass via the legacy JS API, which prints a deprecation
                // warning on every build (going away in Dart Sass 2.0).
                api: 'modern-compiler'
            }
        }
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
