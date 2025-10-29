# Hierarchical Route Composition - Design Document

## Problem Statement

Currently, when defining nested/hierarchical routes, developers must manually repeat parent route metadata (breadcrumbs, permissions, etc.) in each child route:

```javascript
const routes = {
    '/documents': createRoute({
        component: Documents,
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Documents' }
        ],
        permissions: { any: ['read'] }
    }),

    '/documents/:id': createRoute({
        component: DocumentDetail,
        // Must repeat parent breadcrumbs! 😞
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Documents', path: '/documents' },
            { id: 'documentDetail', label: 'Loading...' }
        ],
        // Must repeat permissions! 😞
        permissions: { any: ['read', 'documents.view'] }
    }),

    '/documents/:id/logs': createRoute({
        component: DocumentLogs,
        // Must repeat all parent breadcrumbs again! 😞
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Documents', path: '/documents' },
            { id: 'documentDetail', label: 'Loading...', path: '/documents/:id' },
            { label: 'Access Logs' }
        ],
        // Must repeat permissions! 😞
        permissions: { any: ['read', 'documents.view', 'logs.view'] }
    })
}
```

**Desired behavior:** Define parent metadata once, automatically inherit in child routes.

## Use Cases to Support

### 1. Breadcrumb Composition
Child routes should automatically inherit parent breadcrumbs.

### 2. Permission Inheritance
Permissions should accumulate down the hierarchy.

### 3. Title Composition
Titles could be composed hierarchically.

### 4. Route Conditions/Guards Inheritance
Conditions should execute from parent to child.

## Design Considerations

### 1. How to Identify Parent Route?

**Option A: Automatic Path Pattern Matching**
- Find parent by matching path prefixes
- `/documents/:id` automatically finds `/documents` as parent

**Option B: Explicit Parent Reference**
- Specify `parentRoute: '/documents'` explicitly

**Option C: Route Tree Structure**
- Nested object structure with `children` property

### 2. Override Behavior

**A. Always Compose (Additive)** - Always append to parent
**B. Allow Full Override** - Flag-based (with/without inherit flag)
**C. Special Syntax** - Import `PARENT_BREADCRUMBS` constant

### 3. Backwards Compatibility

**Option A: Opt-in (Recommended)** - Use `inheritBreadcrumbs: true` flags
**Option B: Always Enabled** - Breaking change, automatic by default

### 4. What Should Be Inheritable?

| Property | Should Inherit? | How? | Notes |
|----------|----------------|------|-------|
| `breadcrumbs` | ✅ Yes | Append | Core use case |
| `permissions` | ✅ Yes | Merge (any/all) | Accumulative security |
| `conditions` | ✅ Yes | Sequential execution | Parent checks first |
| `title` | ❓ Maybe | Compose with separator? | "Parent > Child" |
| `props` | ❓ Maybe | Merge objects | Static props |
| `routeContext` | ❓ Maybe | Merge objects | Custom metadata |
| `loadingComponent` | ❌ No | Override only | Each route can differ |
| `shouldDisplayLoadingOnRouteLoad` | ❌ No | Override only | Route-specific |

### 5. Permission Inheritance Complexity

Permissions have `any: []` (OR) and `all: []` (AND) operators. How to merge them?

**Option A: Combine within same operator**
```javascript
// Result: { any: ['read', 'write'], all: ['authenticated', 'verified'] }
```

**Option B: Parent AND child (both must pass)**
```javascript
// Parent check runs, then child check runs, both must pass
```

**Option C: User-specified merge strategy**
```javascript
inheritPermissions: 'and'  // or 'or' or 'merge'
```

### 6. Resource-Based Authorization

Child routes often need parent authorization to pass first:

```javascript
'/documents/:id': {
    authorizationCallback: async (detail) => {
        return hasAccess(detail.params.id)
    }
},

'/documents/:id/logs': {
    authorizationCallback: async (detail) => {
        // Parent callback should run first
        return hasLogsAccess(detail.params.id)
    },
    inheritAuthorization: true  // Parent auth runs first
}
```

## Recommended Approach

**Start Simple, Iterate:**

### Phase 1: Breadcrumbs with Opt-In Flag
```javascript
'/documents/:id/logs': createRoute({
    component: DocumentLogs,
    breadcrumbs: [{ label: 'Access Logs' }],
    inheritBreadcrumbs: true  // Opt-in, backwards compatible
})
```

### Phase 2: Add More Inheritance Options
- Once breadcrumbs work well, add permissions, conditions
- Learn from real usage patterns

### Phase 3: Consider Tree API
- Only if inheritance flags feel too verbose
- Major version bump (breaking change)

## Example API (Proposed)

```javascript
import { createRoute } from '@keenmate/svelte-spa-router/wrap'

const routes = {
    '/documents': createRoute({
        component: Documents,
        title: 'Documents',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Documents' }
        ],
        permissions: { any: ['read'] },
        conditions: [requireAuth]
    }),

    '/documents/:id': createRoute({
        component: DocumentDetail,
        title: 'Document Detail',
        breadcrumbs: [
            { id: 'documentDetail', label: 'Loading...' }
        ],
        permissions: { any: ['documents.view'] },
        inheritBreadcrumbs: true,  // → Home > Documents > Detail
        inheritPermissions: true,  // → ['read', 'documents.view']
        inheritConditions: true,   // → requireAuth + child conditions
        authorizationCallback: async (detail) => {
            return hasDocumentAccess(detail.params.id)
        }
    }),

    '/documents/:id/logs': createRoute({
        component: DocumentLogs,
        title: 'Access Logs',
        breadcrumbs: [
            { label: 'Access Logs' }
        ],
        permissions: { any: ['logs.view'] },
        inheritBreadcrumbs: true,  // Full path
        inheritPermissions: true,  // All permissions
        inheritConditions: true,   // All parent conditions
        inheritAuthorization: true // Parent auth runs first
    })
}
```

## Files to Modify

1. **`src/lib/wrap.js`**
   - Add support for inherit flags in WrapOptions
   - Document new properties

2. **`src/lib/Router.svelte`**
   - Implement parent route discovery logic
   - Compose breadcrumbs/permissions/conditions
   - Pass composed metadata to components

3. **`src/lib/helpers/permissions.svelte.js`**
   - Add permission merging logic
   - Handle inheritance for createProtectedRoute

4. **Tests**
   - `src/tests/hierarchical-routes.test.js` (new)
   - Test breadcrumb composition
   - Test permission inheritance
   - Test condition execution order

5. **Documentation**
   - Update CLAUDE.md
   - Update README.md
   - Add examples to showcase

## Implementation Complexity

**High** - This affects core routing logic and has many edge cases to handle:
- Parent route discovery
- Multiple inheritance levels (grandparent > parent > child)
- Circular references
- Permission merging strategies
- Authorization callback chaining
- Performance implications
- Testing all combinations

## Priority

**Medium-High** - Valuable feature for apps with deep route hierarchies, but current workaround (JavaScript composition helper functions) works adequately.

## Questions to Answer Before Implementation

1. **Syntax**: Flags (`inheritBreadcrumbs: true`) vs special imports vs tree API?
2. **Discovery**: Automatic path matching vs explicit `parentRoute` reference?
3. **Override**: Can children override inherited metadata?
4. **Permissions**: How to merge `any` and `all` arrays?
5. **Authorization**: Should callbacks chain automatically?
6. **Breaking Changes**: Make opt-in (recommended) or default?

## Related Features

- Nested router support (`prefix` prop) - already exists, different purpose
- Multi-zone routing - different concept, not hierarchical
- Named routes - could help with parent discovery

## Future Enhancements

- Visual route tree debugging tool
- Auto-generate sitemap from route hierarchy
- Breadcrumb middleware/plugins
- Route metadata inheritance visualization
- TypeScript support for inherited types

---

**Status:** ✅ Implemented
**Created:** 2025-01-26
**Completed:** 2025-01-28
**Assignee:** Claude
**Priority:** Medium-High
**Implementation Time:** 3 days
**Risk:** Medium (affects core routing)

## Implementation Summary

Hierarchical routes have been successfully implemented with the following features:

### ✅ Implemented Features

1. **Global Configuration** - `setHierarchicalRoutesEnabled(true)` to enable mode
2. **Parent Route Discovery** - Automatic path pattern matching
3. **Breadcrumb Inheritance** - Concatenates parent → child breadcrumbs
4. **Permission Inheritance** - Sequential execution (parent AND child must pass)
5. **Condition Inheritance** - Parent conditions run before child conditions
6. **Authorization Chaining** - Parent callbacks execute before child callbacks
7. **Opt-Out Flags** - `inheritBreadcrumbs`, `inheritPermissions`, `inheritConditions`, `inheritAuthorization`
8. **Circular Reference Protection** - Prevents infinite loops
9. **Deep Hierarchy Support** - Works with 3+ levels of nesting

### Design Decisions Made

**Permission Merging:** Implemented sequential execution (AND behavior) rather than object merging. This matches filesystem security models where access to nested resources requires passing all parent checks.

**Default Behavior:** Inheritance is enabled by default when hierarchical mode is active. Routes must explicitly opt-out with `inheritX: false` flags.

**Backwards Compatibility:** Hierarchical mode is opt-in via global flag, preserving flat mode as default. Existing apps continue to work without changes.

### Files Modified

- `src/lib/utils.svelte.js` - Added global config flag
- `src/lib/wrap.js` - Added inheritance flags to WrapOptions
- `src/lib/Router.svelte` - Parent discovery and composition logic
- `src/lib/helpers/permissions.svelte.js` - Inheritance support
- `src/tests/hierarchical-routes.test.js` - Comprehensive test suite (NEW)
