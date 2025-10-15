<script>
import {link} from '../../../src/lib/utils.svelte.js'
import {registerRoutes} from '../../../src/lib/routes.svelte.js'

// Register some named routes for testing
registerRoutes({
    home: '/',
    about: '/about',
    userDetail: '/user/:first/:last',
    bookDetail: '/book/:bookId'
})
</script>

<h1>Link Formats Demo</h1>

<p>This page demonstrates all the different ways to use the <code>link</code> action:</p>

<div class="demo-section">
    <h2>1. Old Style (Backward Compatible)</h2>
    <a href="/about" use:link>About Page</a>
</div>

<div class="demo-section">
    <h2>2. Direct href with Object Syntax</h2>
    <a use:link={{href: '/about'}}>About Page (object syntax)</a>
</div>

<div class="demo-section">
    <h2>3. Named Routes with Params</h2>
    <a use:link={{route: 'userDetail', params: {first: 'john', last: 'doe'}}}>
        User: John Doe (named route)
    </a>
</div>

<div class="demo-section">
    <h2>4. Array Shorthand</h2>
    <a use:link={['userDetail', {first: 'jane', last: 'smith'}]}>
        User: Jane Smith (array shorthand)
    </a>
</div>

<div class="demo-section">
    <h2>5. Named Route with Query String</h2>
    <a use:link={{route: 'about', query: {tab: 'info', section: 'details'}}}>
        About with Query Params
    </a>
</div>

<div class="demo-section">
    <h2>6. Direct href with Query (Object)</h2>
    <a use:link={{href: '/about', query: {source: 'demo'}}}>
        About with query (href + query)
    </a>
</div>

<div class="demo-section">
    <h2>7. Array Shorthand with Query</h2>
    <a use:link={['bookDetail', {bookId: '123'}, {preview: 'true'}]}>
        Book Detail with Query (array with query)
    </a>
</div>

<p><a href="/" use:link>← Back to Home</a></p>

<style>
.demo-section {
    margin: 2rem 0;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 4px;
}

.demo-section h2 {
    margin-top: 0;
    font-size: 1.2rem;
    color: #333;
}

.demo-section a {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: #ff3e00;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background 0.2s;
}

.demo-section a:hover {
    background: #d63200;
}

code {
    background: #333;
    color: #aed581;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: monospace;
}
</style>
