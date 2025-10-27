# Svelte SPA Router - Example Application

This example demonstrates the features of `@keenmate/svelte-spa-router` with support for both **hash-based** and **history-based** routing.

## Requirements

**Node.js 22+ Required for Building**

This project requires Node.js version 22 or higher when building for production. The build process uses features and optimizations that depend on Node 22+.

- **Development**: Node.js 18+ works fine for `npm run dev`
- **Production builds**: Node.js 22+ required for `npm run build`

If you encounter build errors, verify your Node version:
```bash
node --version  # Should show v22.x.x or higher
```

## Routing Modes

The example supports two routing modes controlled by the `VITE_ROUTING_MODE` environment variable:

- **History Mode** (default): Uses HTML5 History API with clean URLs (e.g., `/about`)
- **Hash Mode**: Uses hash-based routing (e.g., `/#/about`)

## Development

### Run with History Mode (default)
```bash
npm run dev
# or explicitly
npm run dev:history
```
Runs on http://localhost:5050

### Run with Hash Mode
```bash
npm run dev:hash
```
Runs on http://localhost:5051

## Building

### Build for History Mode
```bash
npm run build:history
```
Output: `dist-history/`

### Build for Hash Mode
```bash
npm run build:hash
```
Output: `dist-hash/`

## Docker

You can build Docker images for either mode:

```dockerfile
# For history mode
ARG ROUTING_MODE=history
ENV VITE_ROUTING_MODE=$ROUTING_MODE
RUN npm run build:${ROUTING_MODE}
```

Or at build time:
```bash
docker build --build-arg ROUTING_MODE=hash -t example-hash .
docker build --build-arg ROUTING_MODE=history -t example-history .
```

## Implementation

The routing mode is configured in `src/main.js`:

```javascript
const routingMode = import.meta.env.VITE_ROUTING_MODE || 'history'
setHashRoutingEnabled(routingMode === 'hash')
```

## Features Demonstrated

- Named routes with `registerRoutes()`
- Route parameters (`:id`, `:first/:last`)
- Optional parameters (`:last?`)
- Wildcard routes (`*`)
- Static prefix parameters (`project-:code`)
- Query string handling
- Navigation guards (`beforeLeave`)
- Route metadata and breadcrumbs
- Permissions system
- Loading states with `shouldDisplayLoadingOnRouteLoad`
- Active link highlighting
- Programmatic navigation (`push`, `replace`, `pop`)
- Scroll restoration
- Filters (OData-style structured mode)
