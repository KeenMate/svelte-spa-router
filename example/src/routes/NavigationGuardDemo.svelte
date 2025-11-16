<script>
import PageWrapper from '../components/PageWrapper.svelte'
import { NavigationCancelledError, registerBeforeLeave, unregisterBeforeLeave, createDirtyCheckGuard } from '@keenmate/svelte-spa-router/helpers/navigation-guard'
import { link } from '@keenmate/svelte-spa-router'
import { onMount, onDestroy, untrack } from 'svelte'

// Form state
let formData = $state({
    name: '',
    email: '',
    message: ''
})

let originalData = {
    name: '',
    email: '',
    message: ''
}

// Track if form has unsaved changes
const formIsDirty = $derived(
    formData.name !== originalData.name ||
    formData.email !== originalData.email ||
    formData.message !== originalData.message
)

// Demo modes
let demoMode = $state('wrapper') // 'wrapper', 'direct', 'helper'

// beforeLeave handler for PageWrapper
async function beforeLeaveHandler(ctx) {
    if (formIsDirty && !confirm(`You have unsaved changes. Leave "${ctx.from}" and go to "${ctx.to}"?`)) {
        throw new NavigationCancelledError()
    }
}

// For direct mode
const directBeforeLeave = async (ctx) => {
    if (formIsDirty && !confirm(`[Direct Mode] Leave "${ctx.from}" for "${ctx.to}"?`)) {
        throw new NavigationCancelledError()
    }
}

// For helper mode
const helperBeforeLeave = createDirtyCheckGuard(
    () => formIsDirty,
    '[Helper Mode] You have unsaved changes. Leave anyway?'
)

// Direct mode registration - only register/unregister when mode changes
$effect(() => {
    // Only register for non-wrapper modes
    if (demoMode === 'direct') {
        untrack(() => registerBeforeLeave(directBeforeLeave))
        return () => untrack(() => unregisterBeforeLeave(directBeforeLeave))
    } else if (demoMode === 'helper') {
        untrack(() => registerBeforeLeave(helperBeforeLeave))
        return () => untrack(() => unregisterBeforeLeave(helperBeforeLeave))
    }
    // Wrapper mode handles registration itself via PageWrapper component
})

function handleSubmit(e) {
    e.preventDefault()
    alert('Form submitted!')
    // Reset dirty state
    originalData = { ...formData }
}

function handleReset() {
    formData = { ...originalData }
}
</script>

{#if demoMode === 'wrapper'}
    <PageWrapper beforeLeave={beforeLeaveHandler}>
        <div class="navigation-guard-demo">
            <h1>Navigation Guard Demo</h1>
            <p>Try to navigate away with unsaved changes!</p>

            <div class="mode-selector">
                <h3>Demo Mode:</h3>
                <label>
                    <input type="radio" bind:group={demoMode} value="wrapper" />
                    PageWrapper Component
                </label>
                <label>
                    <input type="radio" bind:group={demoMode} value="direct" />
                    Direct Registration
                </label>
                <label>
                    <input type="radio" bind:group={demoMode} value="helper" />
                    Helper Function
                </label>
            </div>

            <div class="status-box" class:dirty={formIsDirty}>
                <strong>Form Status:</strong> {formIsDirty ? '🔴 Unsaved Changes' : '✅ Clean'}
            </div>

            <form onsubmit={handleSubmit}>
                <div class="form-group">
                    <label for="name">Name:</label>
                    <input
                        id="name"
                        type="text"
                        bind:value={formData.name}
                        placeholder="Enter your name"
                    />
                </div>

                <div class="form-group">
                    <label for="email">Email:</label>
                    <input
                        id="email"
                        type="email"
                        bind:value={formData.email}
                        placeholder="Enter your email"
                    />
                </div>

                <div class="form-group">
                    <label for="message">Message:</label>
                    <textarea
                        id="message"
                        bind:value={formData.message}
                        placeholder="Enter your message"
                        rows="5"
                    ></textarea>
                </div>

                <div class="button-group">
                    <button type="submit">Submit</button>
                    <button type="button" onclick={handleReset}>Reset</button>
                </div>
            </form>

            <div class="info-box">
                <h3>📖 How it works (PageWrapper Mode)</h3>
                <p>This page uses a <code>PageWrapper</code> component that registers the beforeLeave guard:</p>
                <pre><code>{`<PageWrapper {beforeLeave}>
  <YourPageContent />
</PageWrapper>`}</code></pre>
                <p>Try clicking these links with unsaved changes:</p>
                <nav>
                    <a href="/" use:link>Home</a> •
                    <a href="/about" use:link>About</a> •
                    <a href="/querystring-demo" use:link>Querystring</a>
                </nav>
            </div>

            <div class="code-example">
                <h3>💻 Code Example</h3>
                <pre><code>{`<script>
import PageWrapper from './PageWrapper.svelte'
import { NavigationCancelledError } from '@keenmate/svelte-spa-router/helpers/navigation-guard'

let formIsDirty = $state(false)

async function beforeLeave(ctx) {
  if (formIsDirty && !confirm("Unsaved changes. Leave?")) {
    throw new NavigationCancelledError()
  }
}
</\u{200B}script>

<PageWrapper {beforeLeave}>
  <form>
    <input oninput={() => formIsDirty = true} />
  </form>
</PageWrapper>`}</code></pre>
            </div>
        </div>
    </PageWrapper>
{:else}
    <!-- Direct/Helper mode - no wrapper -->
    <div class="navigation-guard-demo">
        <h1>Navigation Guard Demo</h1>
        <p>Try to navigate away with unsaved changes!</p>

        <div class="mode-selector">
            <h3>Demo Mode:</h3>
            <label>
                <input type="radio" bind:group={demoMode} value="wrapper" />
                PageWrapper Component
            </label>
            <label>
                <input type="radio" bind:group={demoMode} value="direct" />
                Direct Registration
            </label>
            <label>
                <input type="radio" bind:group={demoMode} value="helper" />
                Helper Function
            </label>
        </div>

        <div class="status-box" class:dirty={formIsDirty}>
            <strong>Form Status:</strong> {formIsDirty ? '🔴 Unsaved Changes' : '✅ Clean'}
        </div>

        <form onsubmit={handleSubmit}>
            <div class="form-group">
                <label for="name">Name:</label>
                <input
                    id="name"
                    type="text"
                    bind:value={formData.name}
                    placeholder="Enter your name"
                />
            </div>

            <div class="form-group">
                <label for="email">Email:</label>
                <input
                    id="email"
                    type="email"
                    bind:value={formData.email}
                    placeholder="Enter your email"
                />
            </div>

            <div class="form-group">
                <label for="message">Message:</label>
                <textarea
                    id="message"
                    bind:value={formData.message}
                    placeholder="Enter your message"
                    rows="5"
                ></textarea>
            </div>

            <div class="button-group">
                <button type="submit">Submit</button>
                <button type="button" onclick={handleReset}>Reset</button>
            </div>
        </form>

        <div class="info-box">
            <h3>📖 How it works ({demoMode === 'direct' ? 'Direct' : 'Helper'} Mode)</h3>
            {#if demoMode === 'direct'}
                <p>This mode registers the guard directly using <code>$effect</code>:</p>
                <pre><code>{`const beforeLeave = async (ctx) => {
  if (formIsDirty && !confirm("Leave?")) {
    throw new NavigationCancelledError()
  }
}

$effect(() => {
  registerBeforeLeave(beforeLeave)
  return () => unregisterBeforeLeave(beforeLeave)
})`}</code></pre>
            {:else}
                <p>This mode uses the <code>createDirtyCheckGuard</code> helper:</p>
                <pre><code>{`const beforeLeave = createDirtyCheckGuard(
  () => formIsDirty,
  "You have unsaved changes. Leave anyway?"
)
beforeLeave.isDirty = () => formIsDirty // For browser beforeunload

$effect(() => {
  registerBeforeLeave(beforeLeave)
  return () => unregisterBeforeLeave(beforeLeave)
})`}</code></pre>
            {/if}
            <p>Try clicking these links with unsaved changes:</p>
            <nav>
                <a href="/" use:link>Home</a> •
                <a href="/about" use:link>About</a> •
                <a href="/querystring-demo" use:link>Querystring</a>
            </nav>
        </div>
    </div>
{/if}

<style>
.navigation-guard-demo {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
}

h1 {
    color: #ff3e00;
    margin-bottom: 0.5rem;
}

.mode-selector {
    background: #f0f0f0;
    padding: 1rem;
    border-radius: 8px;
    margin: 1.5rem 0;
}

.mode-selector h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
}

.mode-selector label {
    display: block;
    margin: 0.5rem 0;
    cursor: pointer;
}

.mode-selector input[type="radio"] {
    margin-right: 0.5rem;
}

.status-box {
    background: #e8f5e9;
    border-left: 4px solid #4caf50;
    padding: 1rem;
    margin: 1.5rem 0;
    border-radius: 4px;
    transition: all 0.3s;
}

.status-box.dirty {
    background: #ffebee;
    border-left-color: #f44336;
}

.form-group {
    margin: 1.5rem 0;
}

.form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #ff3e00;
}

.button-group {
    display: flex;
    gap: 1rem;
    margin: 1.5rem 0;
}

button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
}

button[type="submit"] {
    background: #ff3e00;
    color: white;
}

button[type="submit"]:hover {
    background: #d63200;
}

button[type="button"] {
    background: #757575;
    color: white;
}

button[type="button"]:hover {
    background: #616161;
}

.info-box {
    background: #e3f2fd;
    border-left: 4px solid #2196f3;
    padding: 1.5rem;
    margin: 2rem 0;
    border-radius: 4px;
}

.info-box h3 {
    margin-top: 0;
}

.info-box pre {
    background: white;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 1rem 0;
}

.info-box code {
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
}

.info-box nav {
    margin-top: 1rem;
}

.info-box nav a {
    color: #2196f3;
    text-decoration: none;
    font-weight: 500;
}

.info-box nav a:hover {
    text-decoration: underline;
}

.code-example {
    background: #f5f5f5;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 2rem 0;
}

.code-example h3 {
    margin-top: 0;
}

.code-example pre {
    background: #2d2d2d;
    color: #f8f8f2;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 1rem 0;
}

.code-example code {
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
}
</style>
