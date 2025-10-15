# @keenmate/svelte-spa-router Example

This is a simple example demonstrating @keenmate/svelte-spa-router with Svelte 5 runes.

## Setup

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

Then open http://localhost:5050

## Features Demonstrated

- ✅ Basic routing with exact paths (`/`, `/about`)
- ✅ Named parameters (`/user/:first/:last?`)
- ✅ Optional parameters (`:last?`)
- ✅ Wildcard routes (`/book/*`)
- ✅ Catch-all 404 route (`*`)
- ✅ `use:link` action for navigation
- ✅ `use:active` action for active link highlighting
- ✅ Accessing `location()` and `querystring()`
- ✅ Accessing route `params` in components
- ✅ Route event handlers (`onrouteLoaded`)

## Routes

- `/` - Home page with navigation
- `/about` - About page showing location and querystring
- `/user/:first/:last?` - User profile with required first name and optional last name
- `/book/*` - Book details with wildcard parameter
- `*` - 404 Not Found page (catch-all)

## Try These URLs

- http://localhost:5050/#/
- http://localhost:5050/#/about
- http://localhost:5050/#/about?foo=bar
- http://localhost:5050/#/user/john/doe
- http://localhost:5050/#/user/jane
- http://localhost:5050/#/book/svelte-guide
- http://localhost:5050/#/book/advanced/chapter-5
- http://localhost:5050/#/nonexistent (404)
