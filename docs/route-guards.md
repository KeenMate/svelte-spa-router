# Route guards (pre-conditions)

Basic condition example:

```js
const routes = {
    '/admin': wrap({
        asyncComponent: () => import('./routes/Admin.svelte'),
        conditions: [
            // Can be sync or async
            async (detail) => {
                const user = await checkAuth()
                return user.isAdmin
            }
        ]
    })
}
```

**What happens when a condition returns `false`:**

The route's component is not mounted — the slot becomes **empty**. There is no
built-in fallback UI. The router fires the `onConditionsFailed` event and that's
it. The consumer decides what happens next, typically by either redirecting
from inside the condition itself (`await push('/login'); return false`) or by
handling the event globally:

```svelte
<Router
    {routes}
    onConditionsFailed={(e) => push('/login')}
/>
```

If you want batteries-included Unauthorized-component rendering, use the
[permission system](./permissions.md) instead — see [Conditions vs Permissions](./permissions.md#conditions-vs-permissions)
for when to reach for which.
