# History Mode Example

This example demonstrates **history API routing** (clean URLs without hash) using @keenmate/svelte-spa-router.

## Key Differences from Hash Mode

### Hash Mode (default)
- URLs look like: `http://localhost:5051/#/about`
- No server configuration needed
- Works everywhere, even on file:// protocol

### History Mode (this example)
- URLs look like: `http://localhost:5051/about`
- **Requires server configuration** to handle all routes
- More SEO-friendly and cleaner URLs

## Configuration

In `src/main.js`, configure the router **before mounting the app**:

```javascript
import { setHashRoutingEnabled, setBasePath } from '../../utils.svelte.js'

// Enable history mode (disable hash routing)
setHashRoutingEnabled(false)

// Set base path (usually '/' for root)
setBasePath(import.meta.env.BASE_URL || '/')
```

## Running the Example

### Development
```bash
npm install
npm run dev
```

The dev server automatically handles routing.

### Production

For production, your server must be configured to serve `index.html` for all routes.

**Vite example (vite.config.js):**
```javascript
export default {
  base: '/',
  build: {
    outDir: 'dist'
  }
}
```

**Server examples:**

#### Nginx
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

#### Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Express.js
```javascript
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})
```

## Features Demonstrated

✅ Clean URLs without hash
✅ Browser back/forward buttons work
✅ Active link highlighting
✅ Route parameters
✅ Programmatic navigation
✅ Modifier key support (Ctrl+Click opens in new tab)
✅ Target attribute support (_blank, etc.)

## Base Path Configuration

If your app is served from a subdirectory (e.g., `http://example.com/app/`), configure the base path:

```javascript
setBasePath('/app')
```

Make sure to also set it in your build tool:

```javascript
// vite.config.js
export default {
  base: '/app/'
}
```

## Routes

- `/` - Home page with navigation
- `/about` - About page showing location and querystring
- `/user/:first/:last?` - User profile with required first name and optional last name
- `/book/*` - Book details with wildcard parameter
- `*` - 404 Not Found page (catch-all)

## Try These URLs

- http://localhost:5051/
- http://localhost:5051/about
- http://localhost:5051/about?foo=bar
- http://localhost:5051/user/john/doe
- http://localhost:5051/user/jane
- http://localhost:5051/book/svelte-guide
- http://localhost:5051/book/advanced/chapter-5
- http://localhost:5051/nonexistent (404)
