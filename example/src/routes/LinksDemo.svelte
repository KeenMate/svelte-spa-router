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
</div>

<div class="demo-section">
    <h2>2. Direct href with Object Syntax</h2>
    <pre><code>&lt;a use:link=&#123;&#123; href: '/about' &#125;&#125;&gt;About Page&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a use:link={{href: '/about'}}>About Page (object syntax)</a></p>
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
</div>

<div class="demo-section">
    <h2>4. Array Shorthand</h2>
    <pre><code>&lt;a use:link=&#123;['userDetail', &#123; first: 'jane', last: 'smith' &#125;]&#125;&gt;
  User: Jane Smith
&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a use:link={['userDetail', {first: 'jane', last: 'smith'}]}>
        User: Jane Smith (array shorthand)
    </a></p>
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
</div>

<div class="demo-section">
    <h2>6. Direct href with Query (Object)</h2>
    <pre><code>&lt;a use:link=&#123;&#123; href: '/about', query: &#123; source: 'demo' &#125; &#125;&#125;&gt;
  About with query
&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a use:link={{href: '/about', query: {source: 'demo'}}}>
        About with query (href + query)
    </a></p>
</div>

<div class="demo-section">
    <h2>7. Array Shorthand with Query</h2>
    <pre><code>&lt;a use:link=&#123;['bookDetail', &#123; bookId: '123' &#125;, &#123; preview: 'true' &#125;]&#125;&gt;
  Book Detail with Query
&lt;/a&gt;</code></pre>
    <p class="demo-link">Try it: <a use:link={['bookDetail', {bookId: '123'}, {preview: 'true'}]}>
        Book Detail with Query (array with query)
    </a></p>
</div>

<h1>Programmatic Navigation Demo</h1>

<p>Test the new array/object syntax for <code>push()</code> and <code>replace()</code> functions:</p>

<div class="demo-section">
    <h2>1. push() with Array Format</h2>
    <button onclick={navigateWithPush}>
        Navigate to User (Alice Jones) with tab=profile
    </button>
    <pre><code>await push(['userDetail', {'{first: \'alice\', last: \'jones\'}'}, {'{tab: \'profile\'}'}])</code></pre>
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
</div>

<div class="demo-section">
    <h2>3. replace() with Array Format</h2>
    <button onclick={navigateWithReplace}>
        Replace to About with source=programmatic
    </button>
    <pre><code>await replace(['about', {'{}'},  {'{source: \'programmatic\'}'}])</code></pre>
</div>

<div class="demo-section">
    <h2>4. push() with String (Legacy)</h2>
    <button onclick={navigateWithString}>
        Navigate to About (string format)
    </button>
    <pre><code>await push('/about')</code></pre>
</div>

<p><a href="/" use:link>← Back to Home</a></p>
