# Routing modes

The router supports two routing modes:

## Hash mode (default)

Uses hash-based routing with URLs like `http://example.com/#/path`.

**Pros:**
- No server configuration needed
- Works everywhere, including `file://` protocol
- Perfect for static hosting (GitHub Pages, Netlify, etc.)

**Cons:**
- URLs have `#` in them
- Less SEO-friendly (though modern search engines handle it)

**Usage:** No configuration needed — this is the default!

```svelte
<!-- App.svelte -->
<Router {routes}/>
```

## History mode

Uses the History API with clean URLs like `http://example.com/path`.

**Pros:**
- Clean URLs without `#`
- More SEO-friendly
- Better user experience
- Supports modifier keys (Ctrl+Click to open in new tab)
- Respects `target` attribute on links

**Cons:**
- Requires server configuration to serve `index.html` for all routes
- Won't work with `file://` protocol

**Usage:** Configure before mounting your app

```javascript
// main.js
import { mount } from 'svelte'
import { setHashRoutingEnabled, setBasePath } from '@keenmate/svelte-spa-router'
import App from './App.svelte'

// Enable history mode
setHashRoutingEnabled(false)
setBasePath(import.meta.env.BASE_URL || '/')

// Mount app
mount(App, { target: document.body })
```

## Server configuration

For production, configure your server to serve `index.html` for all routes:

```nginx
# Nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

```apache
# Apache .htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

```javascript
// Express.js
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})
```

## Base path configuration

If your app is served from a subdirectory (e.g., `http://example.com/app/`):

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

## Examples

- See `example/` for hash mode (default)
- See `example-history/` for history mode with clean URLs
