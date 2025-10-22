<script>
import {link, push, replace} from '@keenmate/svelte-spa-router/utils'
import {registerRoutes} from '@keenmate/svelte-spa-router/routes'
import '../main.scss'

// Register some named routes for testing
registerRoutes({
    home: '/',
    about: '/about',
    userDetail: '/user/:first/:last',
    bookDetail: '/book/:bookId'
})

// Programmatic navigation examples
async function navigateWithPush() {
    // Array format with params and query
    await push(['userDetail', {first: 'alice', last: 'jones'}, {tab: 'profile'}])
}

async function navigateWithObject() {
    // Object format
    await push({
        route: 'bookDetail',
        params: {bookId: '456'},
        query: {preview: 'true', page: '2'}
    })
}

async function navigateWithReplace() {
    // Replace with array format
    await replace(['about', {}, {source: 'programmatic'}])
}

async function navigateWithString() {
    // Legacy string format (still works)
    await push('/about')
}

async function navigateWithContext() {
    // String path with navigation context data
    await push('/navigation-context-demo', {
        orderId: 12345,
        customer: 'Alice',
        source: 'programmatic'
    })
}

async function navigateWithObjectAndContext() {
    // Object format with navigation context
    await push({
        route: 'userDetail',
        params: { first: 'bob', last: 'smith' },
        query: { tab: 'orders' },
        navigationContext: { userId: 789, role: 'admin' }
    })
}
</script>

<h1>Link Formats Demo</h1>

<p>This page demonstrates all the different ways to use the <code>link</code> action:</p>

<div class="demo-section setup">
    <h2>Setup: Registering Named Routes</h2>
    <p>First, register your named routes (typically in your main component or router setup):</p>
    <pre><code>import &#123; registerRoutes &#125; from '@keenmate/svelte-spa-router/routes'

registerRoutes(&#123;
  home: '/',
  about: '/about',
  userDetail: '/user/:first/:last',
  bookDetail: '/book/:bookId'
&#125;)</code></pre>
</div>

<div class="demo-section">
    <h2>1. Old Style (Backward Compatible)</h2>
    <pre><code>&lt;a href="/about" use:link&gt;About Page&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a href="/about" use:link>About Page</a></p>
    <p class="note">Resolves to: <code>/about</code></p>
</div>

<div class="demo-section">
    <h2>2. Direct href with Object Syntax</h2>
    <pre><code>&lt;a use:link=&#123;&#123; href: '/about' &#125;&#125;&gt;About Page&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a use:link={{href: '/about'}}>About Page (object syntax)</a></p>
    <p class="note">Resolves to: <code>/about</code></p>
</div>

<div class="demo-section">
    <h2>3. Named Routes with Params</h2>
    <pre><code>&lt;a use:link=&#123;&#123;
  route: 'userDetail',
  params: &#123; first: 'john', last: 'doe' &#125;
&#125;&#125;&gt;
  User: John Doe
&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a use:link={{route: 'userDetail', params: {first: 'john', last: 'doe'}}}>
        User: John Doe (named route)
    </a></p>
    <p class="note">Resolves to: <code>/user/john/doe</code></p>
</div>

<div class="demo-section">
    <h2>4. Array Shorthand</h2>
    <pre><code>&lt;a use:link=&#123;['userDetail', &#123; first: 'jane', last: 'smith' &#125;]&#125;&gt;
  User: Jane Smith
&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a use:link={['userDetail', {first: 'jane', last: 'smith'}]}>
        User: Jane Smith (array shorthand)
    </a></p>
    <p class="note">Resolves to: <code>/user/jane/smith</code></p>
</div>

<div class="demo-section">
    <h2>5. Named Route with Query String</h2>
    <pre><code>&lt;a use:link=&#123;&#123;
  route: 'about',
  query: &#123; tab: 'info', section: 'details' &#125;
&#125;&#125;&gt;
  About with Query Params
&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a use:link={{route: 'about', query: {tab: 'info', section: 'details'}}}>
        About with Query Params
    </a></p>
    <p class="note">Resolves to: <code>/about?tab=info&amp;section=details</code></p>
</div>

<div class="demo-section">
    <h2>6. Direct href with Query (Object)</h2>
    <pre><code>&lt;a use:link=&#123;&#123; href: '/about', query: &#123; source: 'demo' &#125; &#125;&#125;&gt;
  About with query
&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a use:link={{href: '/about', query: {source: 'demo'}}}>
        About with query (href + query)
    </a></p>
    <p class="note">Resolves to: <code>/about?source=demo</code></p>
</div>

<div class="demo-section">
    <h2>7. Array Shorthand with Query</h2>
    <pre><code>&lt;a use:link=&#123;['bookDetail', &#123; bookId: '123' &#125;, &#123; preview: 'true' &#125;]&#125;&gt;
  Book Detail with Query
&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a use:link={['bookDetail', {bookId: '123'}, {preview: 'true'}]}>
        Book Detail with Query (array with query)
    </a></p>
    <p class="note">Resolves to: <code>/book/123?preview=true</code></p>
</div>

<div class="demo-section">
    <h2>8. Array with 4 Elements (Navigation Context)</h2>
    <pre><code>&lt;a use:link=&#123;['bookDetail', &#123; bookId: '456' &#125;, &#123; tab: 'reviews' &#125;, &#123; source: 'links-demo' &#125;]&#125;&gt;
  Book with Context
&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a use:link={['bookDetail', {bookId: '456'}, {tab: 'reviews'}, {source: 'links-demo'}]}>
        Book with Navigation Context (4-element array)
    </a></p>
    <p class="note">Resolves to: <code>/book/456?tab=reviews</code></p>
    <p class="note">💡 Hidden context: <code>&#123; source: 'links-demo' &#125;</code></p>
</div>

<div class="demo-section">
    <h2>9. Array Shorthand - Params Only</h2>
    <pre><code>&lt;a use:link=&#123;['userDetail', &#123; first: 'bob', last: 'wilson' &#125;]&#125;&gt;
  User: Bob Wilson
&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a use:link={['userDetail', {first: 'bob', last: 'wilson'}]}>
        User: Bob Wilson (2-element array)
    </a></p>
    <p class="note">Resolves to: <code>/user/bob/wilson</code></p>
</div>

<h1>Programmatic Navigation Demo</h1>

<p>Test the new array/object syntax for <code>push()</code> and <code>replace()</code> functions:</p>

<div class="demo-section">
    <h2>1. push() with Array Format</h2>
    <button onclick={navigateWithPush}>
        Navigate to User (Alice Jones) with tab=profile
    </button>
    <pre><code>await push(['userDetail', {'{first: \'alice\', last: \'jones\'}'}, {'{tab: \'profile\'}'}])</code></pre>
    <p class="note">Format: <code>push([routeName, params, query])</code></p>
    <p class="note">Resolves to: <code>/user/alice/jones?tab=profile</code></p>
</div>

<div class="demo-section">
    <h2>2. push() with Object Format</h2>
    <button onclick={navigateWithObject}>
        Navigate to Book Detail with query params
    </button>
    <pre><code>await push({'{'}
  route: 'bookDetail',
  params: {'{bookId: \'456\'}'},
  query: {'{preview: \'true\', page: \'2\'}'}
{'}'})</code></pre>
    <p class="note">Format: <code>push(&#123; route, params, query &#125;)</code></p>
    <p class="note">Resolves to: <code>/book/456?preview=true&amp;page=2</code></p>
</div>

<div class="demo-section">
    <h2>3. replace() with Array Format</h2>
    <button onclick={navigateWithReplace}>
        Replace to About with source=programmatic
    </button>
    <pre><code>await replace(['about', {'{}'},  {'{source: \'programmatic\'}'}])</code></pre>
    <p class="note">Format: <code>replace([routeName, params, query])</code></p>
    <p class="note">Resolves to: <code>/about?source=programmatic</code></p>
    <p class="note">💡 <code>replace()</code> doesn't add new history entry - replaces current one</p>
</div>

<div class="demo-section">
    <h2>4. push() with String (Legacy)</h2>
    <button onclick={navigateWithString}>
        Navigate to About (string format)
    </button>
    <pre><code>await push('/about')</code></pre>
    <p class="note">Format: <code>push(path)</code> - Simple string path</p>
    <p class="note">Resolves to: <code>/about</code></p>
</div>

<h1>Navigation Context Demo</h1>

<p>Pass data during navigation without showing it in the URL (WinForms-like experience):</p>

<div class="demo-section">
    <h2>5. push() with Navigation Context (String + Data)</h2>
    <button onclick={navigateWithContext}>
        Navigate with hidden context data
    </button>
    <pre><code>await push('/navigation-context-demo', {'{'}
  orderId: 12345,
  customer: 'Alice',
  source: 'programmatic'
{'}'})</code></pre>
    <p class="note">Format: <code>push(path, navigationContext)</code></p>
    <p class="note">Resolves to: <code>/navigation-context-demo</code> (clean URL)</p>
    <p class="note">💡 Context data accessible via <code>navigationContext()</code> in target route</p>
</div>

<div class="demo-section">
    <h2>6. push() with Object + Navigation Context</h2>
    <button onclick={navigateWithObjectAndContext}>
        Navigate with params, query, and context
    </button>
    <pre><code>await push({'{'}
  route: 'userDetail',
  params: {'{first: \'bob\', last: \'smith\'}'},
  query: {'{tab: \'orders\'}'},
  navigationContext: {'{userId: 789, role: \'admin\'}'}
{'}'})</code></pre>
    <p class="note">Format: <code>push(&#123; route, params, query, navigationContext &#125;)</code></p>
    <p class="note">Resolves to: <code>/user/bob/smith?tab=orders</code></p>
    <p class="note">💡 Hidden context: <code>&#123; userId: 789, role: 'admin' &#125;</code></p>
</div>

<p><a href="/" use:link>← Back to Home</a></p>

<style>
.note {
    margin: 0.5rem 0 0 0;
    padding: 0.5rem 1rem;
    background: #f0f9ff;
    border-left: 3px solid #3b82f6;
    color: #1e40af;
    font-size: 0.9rem;
}

.note code {
    background: #dbeafe;
    color: #1e40af;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-weight: 600;
}
</style>
