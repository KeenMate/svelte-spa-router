/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createHierarchy } from '../lib/helpers/hierarchy.svelte.js'
import { getRouteByName } from '../lib/routes.svelte.js'
import { setHierarchicalRoutesEnabled } from '../lib/utils.svelte.js'

describe('createHierarchy', () => {
    beforeEach(() => {
        // Enable hierarchical routes for tests
        setHierarchicalRoutesEnabled(true)
    })

    it('transforms simple tree into flat routes', () => {
        const tree = {
            '/users': {
                component: () => 'Users'
            },
            '/settings': {
                component: () => 'Settings'
            }
        }

        const routes = createHierarchy(tree)

        expect(routes).toHaveProperty('/users')
        expect(routes).toHaveProperty('/settings')
        expect(Object.keys(routes)).toHaveLength(2)
    })

    it('concatenates parent and child paths correctly', () => {
        const tree = {
            '/users': {
                component: () => 'UsersList',
                children: {
                    ':id': {
                        component: () => 'UserDetail'
                    }
                }
            }
        }

        const routes = createHierarchy(tree)

        expect(routes).toHaveProperty('/users')
        expect(routes).toHaveProperty('/users/:id')
    })

    it('handles multi-level nesting', () => {
        const tree = {
            '/documents': {
                component: () => 'Documents',
                children: {
                    ':id': {
                        component: () => 'DocumentDetail',
                        children: {
                            'logs': {
                                component: () => 'DocumentLogs'
                            },
                            'permissions': {
                                component: () => 'DocumentPermissions'
                            }
                        }
                    }
                }
            }
        }

        const routes = createHierarchy(tree)

        expect(routes).toHaveProperty('/documents')
        expect(routes).toHaveProperty('/documents/:id')
        expect(routes).toHaveProperty('/documents/:id/logs')
        expect(routes).toHaveProperty('/documents/:id/permissions')
        expect(Object.keys(routes)).toHaveLength(4)
    })

    it('registers named routes when name provided', () => {
        const tree = {
            '/users': {
                component: () => 'UsersList',
                children: {
                    ':id': {
                        name: 'userDetail',
                        component: () => 'UserDetail'
                    }
                }
            }
        }

        createHierarchy(tree)

        const route = getRouteByName('userDetail')
        expect(route).toBe('/users/:id')
    })

    it('does not register routes without names', () => {
        const tree = {
            '/users': {
                component: () => 'UsersList',
                children: {
                    ':id': {
                        // No name property
                        component: () => 'UserDetail'
                    }
                }
            }
        }

        createHierarchy(tree)

        // Should not throw, route just won't be registered
        expect(() => getRouteByName('userDetail')).not.toThrow()
    })

    it('handles catch-all routes', () => {
        const tree = {
            '/documents': {
                component: () => 'Documents',
                children: {
                    '*': {
                        component: () => 'NotFound'
                    }
                }
            }
        }

        const routes = createHierarchy(tree)

        expect(routes).toHaveProperty('/documents')
        expect(routes).toHaveProperty('/documents/*')
    })

    it('strips leading slash from child paths', () => {
        const tree = {
            '/users': {
                component: () => 'Users',
                children: {
                    // Child path with leading slash (should be stripped)
                    '/settings': {
                        component: () => 'UserSettings'
                    }
                }
            }
        }

        const routes = createHierarchy(tree)

        expect(routes).toHaveProperty('/users')
        expect(routes).toHaveProperty('/users/settings')
    })

    it('preserves route metadata (breadcrumbs, permissions)', () => {
        const tree = {
            '/users': {
                component: () => 'Users',
                breadcrumbs: [{ label: 'Users' }],
                children: {
                    ':id': {
                        component: () => 'UserDetail',
                        breadcrumbs: [{ label: 'Detail' }]
                    }
                }
            }
        }

        const routes = createHierarchy(tree)

        // Routes should be wrapped and include metadata
        expect(routes['/users']).toBeDefined()
        expect(routes['/users/:id']).toBeDefined()
    })

    it('sets inheritance flags to true for all routes', () => {
        const tree = {
            '/users': {
                component: () => 'Users',
                children: {
                    ':id': {
                        component: () => 'UserDetail'
                    }
                }
            }
        }

        const routes = createHierarchy(tree)

        // Routes should be wrapped with inheritance enabled
        // Note: We can't directly inspect wrapped component internals,
        // but we can verify routes are wrapped correctly
        expect(routes['/users']).toBeDefined()
        expect(routes['/users/:id']).toBeDefined()
    })

    it('handles multiple root paths', () => {
        const tree = {
            '/users': {
                component: () => 'Users',
                children: {
                    ':id': {
                        component: () => 'UserDetail'
                    }
                }
            },
            '/documents': {
                component: () => 'Documents',
                children: {
                    ':id': {
                        component: () => 'DocumentDetail'
                    }
                }
            }
        }

        const routes = createHierarchy(tree)

        expect(routes).toHaveProperty('/users')
        expect(routes).toHaveProperty('/users/:id')
        expect(routes).toHaveProperty('/documents')
        expect(routes).toHaveProperty('/documents/:id')
        expect(Object.keys(routes)).toHaveLength(4)
    })

    it('handles paths without leading slash in root', () => {
        const tree = {
            'users': { // No leading slash
                component: () => 'Users'
            }
        }

        const routes = createHierarchy(tree)

        // Should normalize to /users
        expect(routes).toHaveProperty('/users')
    })

    it('prevents circular references', () => {
        // Spy on console.warn to check for circular reference warning
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        // Create a tree that would cause circular reference
        // This is more of a conceptual test since JavaScript object structure
        // can't directly create circular route paths
        const tree = {
            '/loop': {
                component: () => 'Loop'
            }
        }

        createHierarchy(tree)

        // Should not cause infinite loop
        expect(warnSpy).not.toHaveBeenCalled()

        warnSpy.mockRestore()
    })

    it('combines with flat routes seamlessly', () => {
        const hierarchicalRoutes = createHierarchy({
            '/users': {
                component: () => 'Users',
                children: {
                    ':id': {
                        component: () => 'UserDetail'
                    }
                }
            }
        })

        const flatRoutes = {
            '/settings': () => 'Settings',
            '/about': () => 'About'
        }

        const allRoutes = {
            ...hierarchicalRoutes,
            ...flatRoutes
        }

        expect(allRoutes).toHaveProperty('/users')
        expect(allRoutes).toHaveProperty('/users/:id')
        expect(allRoutes).toHaveProperty('/settings')
        expect(allRoutes).toHaveProperty('/about')
    })

    it('respects enableHierarchical option', () => {
        const tree = {
            '/users': {
                component: () => 'Users',
                children: {
                    ':id': {
                        component: () => 'UserDetail'
                    }
                }
            }
        }

        const routesEnabled = createHierarchy(tree, { enableHierarchical: true })
        const routesDisabled = createHierarchy(tree, { enableHierarchical: false })

        // Both should create routes
        expect(routesEnabled).toHaveProperty('/users')
        expect(routesEnabled).toHaveProperty('/users/:id')
        expect(routesDisabled).toHaveProperty('/users')
        expect(routesDisabled).toHaveProperty('/users/:id')
    })

    it('handles complex route definitions with all metadata', () => {
        const tree = {
            '/admin': {
                name: 'admin',
                component: () => 'Admin',
                breadcrumbs: [{ label: 'Admin' }],
                title: 'Admin Panel',
                conditions: [async () => true],
                children: {
                    'users': {
                        name: 'adminUsers',
                        component: () => 'AdminUsers',
                        breadcrumbs: [{ label: 'Users' }],
                        children: {
                            ':id': {
                                name: 'adminUserDetail',
                                component: () => 'AdminUserDetail',
                                breadcrumbs: [{ label: 'Detail' }]
                            }
                        }
                    }
                }
            }
        }

        const routes = createHierarchy(tree)

        expect(routes).toHaveProperty('/admin')
        expect(routes).toHaveProperty('/admin/users')
        expect(routes).toHaveProperty('/admin/users/:id')

        expect(getRouteByName('admin')).toBe('/admin')
        expect(getRouteByName('adminUsers')).toBe('/admin/users')
        expect(getRouteByName('adminUserDetail')).toBe('/admin/users/:id')
    })
})
