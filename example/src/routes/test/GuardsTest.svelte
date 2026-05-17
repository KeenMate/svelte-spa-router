<script>
    import { link } from '@keenmate/svelte-spa-router'
</script>

<svelte:head>
    <title>Test &mdash; guards / conditions</title>
</svelte:head>

<main>
    <h1>Guards / Conditions Test Fixture</h1>
    <p>
        Targeted by <code>e2e/guards-conditions.spec.ts</code>. Each link below points to a route
        defined with <code>{'wrap({ conditions: […] })'}</code>. Conditions append their name to
        <code>window.__guardCalls</code> so the spec can verify order + short-circuit behavior.
    </p>

    <section class="links">
        <a href="/test/guards/allow" data-testid="link-allow" use:link>/test/guards/allow — [pass]</a>
        <a href="/test/guards/deny" data-testid="link-deny" use:link>/test/guards/deny — [fail]</a>
        <a href="/test/guards/pass-then-fail" data-testid="link-pass-then-fail" use:link>
            /test/guards/pass-then-fail — [pass, fail]
        </a>
        <a href="/test/guards/fail-then-skip" data-testid="link-fail-then-skip" use:link>
            /test/guards/fail-then-skip — [fail, would-pass] (short-circuit)
        </a>
        <a href="/test/guards/async-allow" data-testid="link-async-allow" use:link>/test/guards/async-allow — async pass</a>
        <a href="/test/guards/async-deny" data-testid="link-async-deny" use:link>/test/guards/async-deny — async fail</a>
        <a href="/test/guards/echo/42" data-testid="link-echo" use:link>/test/guards/echo/42 — records detail</a>
    </section>
</main>

<style>
    main {
        max-width: 760px;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .links { display: flex; flex-direction: column; gap: 0.25rem; }
    .links a { font-size: 0.85rem; color: #1d4ed8; }
</style>
