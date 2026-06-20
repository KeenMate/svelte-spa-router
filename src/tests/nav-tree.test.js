import { describe, it, expect, beforeEach } from 'vitest'
import {
    filterByPermissions,
    isNodeHidden,
    isNodeDisabled,
    walkTree,
    findNodeByPath
} from '../lib/helpers/nav-tree.svelte.js'
import { configurePermissions } from '../lib/helpers/permissions.svelte.js'

/**
 * Test users — same shape as example/src/stores/userStore.svelte.js so the
 * filter behavior here mirrors what the live demo does.
 */
const USERS = {
    guest:  { permissions: [] },
    donna:  { permissions: ['read', 'write', 'user:view'] },
    audrey: { permissions: ['read', 'admin', 'user:view', 'user:edit', 'settings:manage'] }
}

let currentUser

function checkPermissions(user, spec) {
    if (!user || !spec) return false
    if (spec.any) return spec.any.some((p) => user.permissions.includes(p))
    if (spec.all) return spec.all.every((p) => user.permissions.includes(p))
    return false
}

function makeTree() {
    return [
        { path: '/', title: 'Overview' },
        {
            path: '/users',
            title: 'Users',
            permissions: { any: ['user:view'] },
            children: [
                { path: '/users/list', title: 'All', permissions: { any: ['user:view'] } },
                { path: '/users/new',  title: 'Create', permissions: { any: ['user:edit'] } }
            ]
        },
        {
            path: '/admin',
            title: 'Admin',
            permissions: { any: ['admin'] },
            children: [
                { path: '/admin/dashboard', title: 'Dashboard' },
                { path: '/admin/audit',     title: 'Audit' }
            ]
        }
    ]
}

beforeEach(() => {
    currentUser = USERS.donna
    configurePermissions({
        checkPermissions,
        getCurrentUser: () => currentUser
    })
})

describe('isNodeHidden', () => {
    it('returns false when not set', () => {
        expect(isNodeHidden({ path: '/' })).toBe(false)
    })

    it('returns true for static true', () => {
        expect(isNodeHidden({ path: '/', hidden: true })).toBe(true)
    })

    it('calls the getter and returns its result', () => {
        expect(isNodeHidden({ path: '/', hidden: () => true })).toBe(true)
        expect(isNodeHidden({ path: '/', hidden: () => false })).toBe(false)
    })

    it('passes the node to the getter', () => {
        const node = { path: '/foo', hidden: (n) => n.path === '/foo' }
        expect(isNodeHidden(node)).toBe(true)
    })
})

describe('filterByPermissions — mode: hide (default)', () => {
    it('keeps all nodes for a fully-permissioned user', () => {
        currentUser = USERS.audrey
        const result = filterByPermissions(makeTree())
        expect(result.map((n) => n.path)).toEqual(['/', '/users', '/admin'])
        expect(result[1].children.map((c) => c.path)).toEqual(['/users/list', '/users/new'])
    })

    it('drops the user:edit-gated child for a less-permissioned user', () => {
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree())
        const users = result.find((n) => n.path === '/users')
        expect(users.children.map((c) => c.path)).toEqual(['/users/list'])  // 'Create' gone
    })

    it('drops the Admin parent when all children fail inheritance', () => {
        // Donna lacks 'admin', so /admin and its inherited children all fail
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree())
        expect(result.find((n) => n.path === '/admin')).toBeUndefined()
    })

    it('drops the whole tree for a no-permission user', () => {
        currentUser = USERS.guest
        const result = filterByPermissions(makeTree())
        expect(result.map((n) => n.path)).toEqual(['/'])   // only public Overview remains
    })

    it('drops nodes with hidden: true regardless of user permissions', () => {
        currentUser = USERS.audrey
        const tree = [
            ...makeTree(),
            { path: '/secret', title: 'Secret', hidden: true }
        ]
        const result = filterByPermissions(tree)
        expect(result.find((n) => n.path === '/secret')).toBeUndefined()
    })

    it('respects hidden getter form', () => {
        currentUser = USERS.audrey
        const tree = [
            { path: '/visible',   title: 'V', hidden: () => false },
            { path: '/dev-only',  title: 'D', hidden: () => true }   // simulated env-gate
        ]
        const result = filterByPermissions(tree)
        expect(result.map((n) => n.path)).toEqual(['/visible'])
    })

    it('respects keepIfEmpty on parents whose children all dropped', () => {
        currentUser = USERS.donna
        const tree = [
            {
                path: '/section',
                title: 'Section',
                keepIfEmpty: true,
                children: [
                    { path: '/section/secret', title: 'X', permissions: { any: ['admin'] } }
                ]
            }
        ]
        const result = filterByPermissions(tree)
        expect(result.map((n) => n.path)).toEqual(['/section'])
        expect(result[0].children).toEqual([])
    })

    it('inheritPermissions: false makes child accessible despite parent guard', () => {
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree(), { inheritPermissions: false })
        const admin = result.find((n) => n.path === '/admin')
        // /admin itself still fails (own perms), so still dropped...
        expect(admin).toBeUndefined()
        // ...but if we strip /admin's own perms too, children should reappear:
        const tree = makeTree()
        const adminNode = tree.find((n) => n.path === '/admin')
        delete adminNode.permissions
        const result2 = filterByPermissions(tree, { inheritPermissions: false })
        const admin2 = result2.find((n) => n.path === '/admin')
        expect(admin2.children.map((c) => c.path)).toEqual(['/admin/dashboard', '/admin/audit'])
    })
})

describe('filterByPermissions — mode: disable', () => {
    it('keeps inaccessible nodes with _forbidden: true', () => {
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree(), { mode: 'disable' })

        const admin = result.find((n) => n.path === '/admin')
        expect(admin).toBeDefined()
        expect(admin._forbidden).toBe(true)
        expect(admin._forbiddenClassName).toBe('forbidden')
    })

    it('attaches custom forbiddenClassName', () => {
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree(), {
            mode: 'disable',
            forbiddenClassName: 'is-locked'
        })
        const admin = result.find((n) => n.path === '/admin')
        expect(admin._forbiddenClassName).toBe('is-locked')
    })

    it('cascades _forbidden up: parent gets it when all visible children are forbidden', () => {
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree(), { mode: 'disable' })
        const admin = result.find((n) => n.path === '/admin')
        // Children inherit /admin perms, fail, get _forbidden. Parent then
        // sees all children forbidden → parent _forbidden too.
        expect(admin._forbidden).toBe(true)
        expect(admin.children.every((c) => c._forbidden)).toBe(true)
    })

    it('does NOT mark accessible nodes as forbidden', () => {
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree(), { mode: 'disable' })
        const overview = result.find((n) => n.path === '/')
        expect(overview._forbidden).toBeUndefined()
    })

    it('still drops hidden: true nodes (hide takes precedence over disable)', () => {
        currentUser = USERS.audrey
        const tree = [
            ...makeTree(),
            { path: '/secret', title: 'Secret', hidden: true }
        ]
        const result = filterByPermissions(tree, { mode: 'disable' })
        expect(result.find((n) => n.path === '/secret')).toBeUndefined()
    })

    it('user with full access sees no forbidden flags', () => {
        currentUser = USERS.audrey
        const result = filterByPermissions(makeTree(), { mode: 'disable' })
        for (const node of walkTree(result)) {
            expect(node._forbidden).toBeUndefined()
        }
    })
})

describe('filterByPermissions — reactivity to user changes', () => {
    it('produces different output as the configured user changes', () => {
        // Same input, two different users, two different outputs — proves
        // the filter reads through the configured user getter on each call.
        // In a `$derived` block, this is what makes the sidebar reactive.
        currentUser = USERS.donna
        const donnaResult = filterByPermissions(makeTree())

        currentUser = USERS.audrey
        const audreyResult = filterByPermissions(makeTree())

        expect(donnaResult.find((n) => n.path === '/admin')).toBeUndefined()
        expect(audreyResult.find((n) => n.path === '/admin')).toBeDefined()
    })
})

describe('filterByPermissions — tooltip resolution', () => {
    it('resolves a static string tooltip onto every output node that declares it', () => {
        currentUser = USERS.audrey
        const tree = [
            { path: '/', title: 'Home', tooltip: 'Go home' }
        ]
        const [root] = filterByPermissions(tree)
        expect(root._tooltip).toBe('Go home')
    })

    it('invokes callback tooltips with the resolved forbidden state', () => {
        currentUser = USERS.donna
        const calls = []
        const tree = [
            {
                path: '/admin',
                title: 'Admin',
                permissions: { any: ['admin'] },
                tooltip: (node, ctx) => {
                    calls.push({ path: node.path, forbidden: ctx.forbidden })
                    return ctx.forbidden ? 'Locked' : null
                }
            }
        ]
        const [adminDisabled] = filterByPermissions(tree, { mode: 'disable' })
        expect(calls).toEqual([{ path: '/admin', forbidden: true }])
        expect(adminDisabled._forbidden).toBe(true)
        expect(adminDisabled._tooltip).toBe('Locked')
    })

    it('callback returning null leaves _tooltip off the output', () => {
        currentUser = USERS.audrey
        const tree = [
            {
                path: '/users',
                title: 'Users',
                permissions: { any: ['user:view'] },
                tooltip: (_node, { forbidden }) => (forbidden ? 'Locked' : null)
            }
        ]
        const [users] = filterByPermissions(tree, { mode: 'disable' })
        expect(users._forbidden).toBeUndefined()
        expect(users._tooltip).toBeUndefined()
    })

    it('hide mode still resolves tooltips on visible nodes', () => {
        currentUser = USERS.audrey
        const tree = [
            { path: '/', title: 'Home', tooltip: () => 'Hover me' }
        ]
        const [root] = filterByPermissions(tree, { mode: 'hide' })
        expect(root._tooltip).toBe('Hover me')
    })

    it('empty-string tooltip is treated as no tooltip', () => {
        currentUser = USERS.audrey
        const tree = [{ path: '/', title: 'Home', tooltip: '' }]
        const [root] = filterByPermissions(tree)
        expect(root._tooltip).toBeUndefined()
    })
})

describe('filterByPermissions — disabled flag', () => {
    it('renders disabled nodes as forbidden in hide mode — product-level placeholders are always visible', () => {
        currentUser = USERS.audrey
        const tree = [{ path: '/coming', title: 'Coming', disabled: true }]
        const [n] = filterByPermissions(tree, { mode: 'hide' })
        expect(n.path).toBe('/coming')
        expect(n._forbidden).toBe(true)
    })

    it('ancestor permission denial still hides disabled descendants in hide mode', () => {
        currentUser = USERS.donna   // lacks 'admin'
        const tree = [
            {
                path: '/admin',
                title: 'Admin',
                permissions: { any: ['admin'] },
                children: [
                    { path: '/admin/integrations', title: 'Integrations', disabled: true }
                ]
            }
        ]
        // Parent denied → entire subtree gone, even the disabled child:
        // you can't see a placeholder for a section you can't enter.
        expect(filterByPermissions(tree, { mode: 'hide' })).toEqual([])
    })

    it('marks disabled nodes as forbidden in disable mode', () => {
        currentUser = USERS.audrey
        const tree = [{ path: '/coming', title: 'Coming', disabled: true }]
        const [n] = filterByPermissions(tree, { mode: 'disable' })
        expect(n._forbidden).toBe(true)
        expect(n._forbiddenClassName).toBe('forbidden')
    })

    it('disabled getter is reactive — re-evaluated on each filter call', () => {
        currentUser = USERS.audrey
        let released = false
        const tree = [
            { path: '/x', title: 'X', disabled: () => !released }
        ]
        // Before release: shows as forbidden (the placeholder)
        const [pre] = filterByPermissions(tree, { mode: 'hide' })
        expect(pre._forbidden).toBe(true)
        // After release: shows as a normal link
        released = true
        const [post] = filterByPermissions(tree, { mode: 'hide' })
        expect(post._forbidden).toBeUndefined()
    })

    it('disabled is self-only — does not cascade to children permissions', () => {
        currentUser = USERS.audrey
        const tree = [
            {
                path: '/parent',
                title: 'P',
                disabled: true,
                children: [
                    { path: '/parent/child', title: 'C' }
                ]
            }
        ]
        // disable mode keeps the parent (forbidden) and the child too —
        // child isn't disabled, parent doesn't propagate the flag.
        const [parent] = filterByPermissions(tree, { mode: 'disable' })
        expect(parent._forbidden).toBe(true)
        expect(parent.children).toHaveLength(1)
        expect(parent.children[0]._forbidden).toBeUndefined()
    })

    it('passes resolved forbidden=true to the tooltip callback', () => {
        currentUser = USERS.audrey
        const tree = [
            {
                path: '/coming',
                title: 'Coming',
                disabled: true,
                tooltip: (_n, { forbidden }) => (forbidden ? 'Coming soon' : null)
            }
        ]
        const [n] = filterByPermissions(tree, { mode: 'disable' })
        expect(n._tooltip).toBe('Coming soon')
    })

    it('isNodeDisabled handles both boolean and getter shapes', () => {
        expect(isNodeDisabled({ path: '/' })).toBe(false)
        expect(isNodeDisabled({ path: '/', disabled: true })).toBe(true)
        expect(isNodeDisabled({ path: '/', disabled: () => true })).toBe(true)
        expect(isNodeDisabled({ path: '/', disabled: () => false })).toBe(false)
    })
})

describe('filterByPermissions — disabledClassName', () => {
    it('falls back to forbiddenClassName when disabledClassName is unset (backward compat)', () => {
        currentUser = USERS.audrey
        const tree = [{ path: '/x', title: 'X', disabled: true }]
        const [n] = filterByPermissions(tree, { mode: 'disable' })
        expect(n._forbiddenClassName).toBe('forbidden')
    })

    it('applies disabledClassName to a disabled node in disable mode', () => {
        currentUser = USERS.audrey
        const tree = [{ path: '/x', title: 'X', disabled: true }]
        const [n] = filterByPermissions(tree, {
            mode: 'disable',
            disabledClassName: 'unavailable'
        })
        expect(n._forbidden).toBe(true)
        expect(n._forbiddenClassName).toBe('unavailable')
    })

    it('applies disabledClassName to a disabled node in hide mode too', () => {
        currentUser = USERS.audrey
        const tree = [{ path: '/x', title: 'X', disabled: true }]
        const [n] = filterByPermissions(tree, {
            mode: 'hide',
            disabledClassName: 'unavailable'
        })
        expect(n._forbiddenClassName).toBe('unavailable')
    })

    it('permission-denied nodes keep forbiddenClassName, not disabledClassName', () => {
        currentUser = USERS.donna   // lacks 'admin'
        const tree = [
            { path: '/admin', title: 'Admin', permissions: { any: ['admin'] } }
        ]
        const [n] = filterByPermissions(tree, {
            mode: 'disable',
            forbiddenClassName: 'forbidden',
            disabledClassName: 'unavailable'
        })
        expect(n._forbidden).toBe(true)
        expect(n._forbiddenClassName).toBe('forbidden')
    })

    it('disabled wins over permission denial when both apply', () => {
        currentUser = USERS.donna   // lacks 'admin'
        const tree = [
            {
                path: '/admin/coming',
                title: 'Coming',
                permissions: { any: ['admin'] },
                disabled: true
            }
        ]
        const [n] = filterByPermissions(tree, {
            mode: 'disable',
            forbiddenClassName: 'forbidden',
            disabledClassName: 'unavailable'
        })
        expect(n._forbidden).toBe(true)
        expect(n._forbiddenClassName).toBe('unavailable')
    })

    it('cascade parents (forbidden via children) keep forbiddenClassName, not disabledClassName', () => {
        currentUser = USERS.donna
        const tree = [
            {
                path: '/p',
                title: 'P',
                children: [
                    { path: '/p/a', title: 'A', permissions: { any: ['admin'] } },
                    { path: '/p/b', title: 'B', permissions: { any: ['admin'] } }
                ]
            }
        ]
        const [parent] = filterByPermissions(tree, {
            mode: 'disable',
            forbiddenClassName: 'forbidden',
            disabledClassName: 'unavailable'
        })
        // Parent is forbidden only because its visible children are. The parent
        // itself isn't `disabled: true`, so it picks up the forbidden class.
        expect(parent._forbidden).toBe(true)
        expect(parent._forbiddenClassName).toBe('forbidden')
    })

    it('mixed tree: each forbidden node picks the class matching its source', () => {
        currentUser = USERS.donna
        const tree = [
            { path: '/a', title: 'Admin', permissions: { any: ['admin'] } },   // permission-denied
            { path: '/b', title: 'Coming', disabled: true },                    // disabled
            { path: '/c', title: 'Public' }                                      // allowed
        ]
        const out = filterByPermissions(tree, {
            mode: 'disable',
            forbiddenClassName: 'forbidden',
            disabledClassName: 'unavailable'
        })
        const [a, b, c] = out
        expect(a._forbiddenClassName).toBe('forbidden')
        expect(b._forbiddenClassName).toBe('unavailable')
        expect(c._forbidden).toBeUndefined()
        expect(c._forbiddenClassName).toBeUndefined()
    })
})

describe('filterByPermissions — noRoute pass-through', () => {
    it('preserves noRoute on output nodes so consumers can branch on it', () => {
        currentUser = USERS.audrey
        const tree = [
            {
                path: '/users',
                title: 'Users',
                noRoute: true,
                children: [
                    { path: '/users/list', title: 'All' }
                ]
            }
        ]
        const [users] = filterByPermissions(tree)
        expect(users.noRoute).toBe(true)
        expect(users.children).toHaveLength(1)
        expect(users.children[0].noRoute).toBeUndefined()
    })

    it('walkTree yields noRoute nodes so the consumer can filter at registration', () => {
        const tree = [
            { path: '/', title: 'Home' },
            {
                path: '/users',
                title: 'Users',
                noRoute: true,
                children: [{ path: '/users/list', title: 'All' }]
            }
        ]
        const routable = Array.from(walkTree(tree))
            .filter((n) => !n.noRoute)
            .map((n) => n.path)
        expect(routable).toEqual(['/', '/users/list'])
    })

    it('noRoute parent still forbidden-cascades when every visible child is forbidden', () => {
        currentUser = USERS.guest
        const tree = [
            {
                path: '/users',
                title: 'Users',
                noRoute: true,
                children: [
                    { path: '/users/list', title: 'All', permissions: { any: ['user:view'] } }
                ]
            }
        ]
        const [users] = filterByPermissions(tree, { mode: 'disable' })
        expect(users.noRoute).toBe(true)
        expect(users._forbidden).toBe(true)
    })
})

describe('walkTree + findNodeByPath', () => {
    it('walkTree yields every node depth-first', () => {
        const tree = makeTree()
        const paths = Array.from(walkTree(tree)).map((n) => n.path)
        expect(paths).toEqual([
            '/',
            '/users', '/users/list', '/users/new',
            '/admin', '/admin/dashboard', '/admin/audit'
        ])
    })

    it('findNodeByPath returns the matching node or null', () => {
        const tree = makeTree()
        expect(findNodeByPath(tree, '/users/new').title).toBe('Create')
        expect(findNodeByPath(tree, '/nope')).toBeNull()
    })
})
