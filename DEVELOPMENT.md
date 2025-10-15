# Development Guide

> **Note:** This Makefile is Windows-compatible! All commands work on Windows, macOS, and Linux.

## Quick Start

### Running Examples

**History Mode (Clean URLs - Recommended for testing new feature):**
```bash
make dev
```
This starts the history mode example with clean URLs like `/about` (no hash).

**Hash Mode (Traditional URLs):**
```bash
make dev-hash
```
This starts the hash mode example with traditional URLs like `/#/about`.

### Building Examples

**Build both examples:**
```bash
make build
```

**Build hash mode only:**
```bash
make build-hash
```

**Build history mode only:**
```bash
make build-history
```

### Other Commands

**Install dependencies:**
```bash
make install
# or
make setup
```

**Clean build artifacts:**
```bash
make clean
```

**Check package before publishing:**
```bash
make check
```

**See all available commands:**
```bash
make help
```

## Project Structure

```
@keenmate/svelte-spa-router/
├── Router.svelte              # Main router component
├── utils.svelte.js            # Core utilities with dual-mode support
├── active.svelte.js           # Active link highlighting
├── wrap.js                    # Route wrapping utility
├── constants.js               # Navigation event constants
├── helpers/
│   ├── url-helpers.svelte.js  # Path joining utilities
│   └── permissions.svelte.js  # Permission system for RBAC
├── example/                   # Hash mode example (#/path)
└── example-history/           # History mode example (/path)
```

## Testing Both Modes

### Hash Mode
1. Run: `make dev-hash`
2. Open: http://localhost:5051 (or whatever port Vite assigns)
3. URLs will look like: `http://localhost:5051/#/about`

### History Mode
1. Run: `make dev`
2. Open: http://localhost:5051 (or whatever port Vite assigns)
3. URLs will look like: `http://localhost:5051/about`
4. Browser back/forward buttons work
5. Ctrl+Click opens in new tab
6. Target attributes are respected

## Making Changes

When modifying core router files:
1. Make changes to router files (Router.svelte, utils.svelte.js, etc.)
2. Both examples automatically reload via Vite HMR
3. Test in both hash and history modes

## Publishing

Before publishing:
```bash
make check        # Verify package is ready
make package      # Package and validate
make publish-dry  # Test publish without actually publishing
make publish      # Publish to npm (requires confirmation)
```

## Version Management

```bash
make version      # Show current version
make bump-patch   # 5.0.0 -> 5.0.1
make bump-minor   # 5.0.0 -> 5.1.0
make bump-major   # 5.0.0 -> 6.0.0
```
