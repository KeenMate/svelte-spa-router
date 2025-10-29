# Hierarchical Routes Example

This document explains how to see hierarchical routes in action in the example app.

## What is Hierarchical Mode?

Hierarchical mode enables automatic inheritance of route metadata from parent to child routes:
- **Breadcrumbs** are concatenated (parent + child)
- **Permissions** are checked sequentially (parent AND child must pass)
- **Conditions** execute in order (parent → child)
- **Authorization callbacks** chain (parent → child)

## Seeing It In Action

### 1. Enable Hierarchical Mode

Hierarchical mode is already enabled in the example app. Check `example/src/main.js`:

```javascript
import { setHierarchicalRoutesEnabled } from '@keenmate/svelte-spa-router/utils'

// Enable hierarchical routes
setHierarchicalRoutesEnabled(true)
```

### 2. Run The Example App

```bash
# From project root
make dev
# or
cd example && npm run dev
```

### 3. Navigate to Document Routes

The example demonstrates hierarchical inheritance with the document routes:

**Parent Route:** `/document/:id`
- Requires permission: `read`
- Has authorization callback: `hasDocumentAccess()`
- Breadcrumbs: `[Home, Documents, Document Detail]`

**Child Route:** `/document/:id/logs`
- Automatically inherits parent's `read` permission
- Automatically inherits parent's authorization callback
- Adds its own breadcrumb: `Document Logs`
- Final breadcrumbs: `[Home, Documents, Document Detail, Document Logs]`

### 4. Test The Inheritance

1. **Navigate to** `/document/123`
   - Check breadcrumbs in UI
   - With "Donna Hayward" (has 'read' permission): ✅ Access granted

2. **Navigate to** `/document/123/logs`
   - Check breadcrumbs: Should show full chain
   - Requires 'read' permission from parent route
   - With "Donna Hayward": ✅ Access granted (inherits parent permission)

3. **Switch user** using the "Toggle 👤" button
   - Test with different user permissions
   - Notice how child route respects parent permissions automatically

## Code Location

See the hierarchical routes implementation in:
- **Configuration:** `example/src/main.js` line 16
- **Route Definitions:** `example/src/App.svelte` lines 91-145
- **Comments:** Detailed inline comments explain the inheritance behavior

## Key Points

### What Gets Inherited (by default)
- ✅ Breadcrumbs (concatenated)
- ✅ Permissions (sequential AND checks)
- ✅ Conditions (parent → child order)
- ✅ Authorization callbacks (chained execution)

### How to Opt-Out
Add inheritance flags to specific routes:

```javascript
'/document/public/:id': wrap({
    component: PublicDocument,
    breadcrumbs: [{ label: 'Public Document' }],
    inheritBreadcrumbs: false,  // Don't inherit parent breadcrumbs
    inheritPermissions: false,  // Don't inherit parent permissions
})
```

### Security Model

Permissions work like filesystem security (Linux/Windows):
- To access `/document/123/logs`, user needs:
  1. ✅ Pass parent `/document/:id` permission check
  2. ✅ Pass parent `/document/:id` authorization callback
  3. ✅ Pass child permissions (if any)
  4. ✅ Pass child authorization (if any)

If **ANY** check fails → access denied (fail-fast)

## Comparison: Flat vs Hierarchical

### Flat Mode (default, hierarchical disabled)
```javascript
// Must explicitly define everything for each route
'/document/:id/logs': wrap({
    component: DocumentLogs,
    breadcrumbs: [
        { label: 'Home', path: '/' },
        { label: 'Documents', path: '/metadata-demo' },
        { label: 'Document Detail', path: '/document/:id' },
        { label: 'Document Logs' }  // Repetitive! 😞
    ]
})
```

### Hierarchical Mode (hierarchical enabled)
```javascript
// Parent defines breadcrumbs once
'/document/:id': wrap({
    breadcrumbs: [
        { label: 'Home', path: '/' },
        { label: 'Documents', path: '/metadata-demo' },
        { label: 'Document Detail' }
    ]
}),

// Child just adds its breadcrumb
'/document/:id/logs': wrap({
    component: DocumentLogs,
    breadcrumbs: [
        { label: 'Document Logs' }  // Clean! 😊
    ]
    // Automatically inherits parent breadcrumbs
})
```

## More Information

- **Design Document:** `HIERARCHICAL_ROUTES_DESIGN.md`
- **Usage Guide:** `CLAUDE.md` (search for "Hierarchical Routes")
- **Test Suite:** `src/tests/hierarchical-routes.test.js`
