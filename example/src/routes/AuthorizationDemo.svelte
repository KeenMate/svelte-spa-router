<script>
import { link, location, querystring, push } from '@keenmate/svelte-spa-router'
import { user, hasDocumentAccess } from '../stores/userStore.svelte.js'
import '../main.scss'

const currentUser = $derived(user())

// Mock documents with different access levels
const documents = [
    { id: 1, title: 'Public Report', owner: 'Dale Cooper', status: 'Open' },
    { id: 4, title: 'Admin Configuration', owner: 'System Admin', status: 'Restricted' }
]

function canAccess(docId) {
    return hasDocumentAccess(docId)
}

async function attemptAccess(doc) {
    if (!canAccess(doc.id)) {
        const returnTo = location()
        const returnQuery = querystring()
        // push(route, routeParams, queryString, navigationContext)
        await push('/unauthorized', {}, {}, {
            resource: 'document',
            id: doc.id,
            title: doc.title,
            user: currentUser.name,
            returnTo,
            returnQuery
        })
    } else {
        await push(`/document/${doc.id}`)
    }
}
</script>

<h1>Authorization Demo</h1>

<div class="user-info">
    <h2>Current User: {currentUser.name}</h2>
    <p><strong>Permissions:</strong> {currentUser.permissions.join(', ')}</p>
    <p><strong>Document Access:</strong> Can access documents {currentUser.accessibleDocuments.join(', ')}</p>
</div>

<div class="info-box">
    <h3>🔐 Resource-Based Authorization</h3>
    <p>This demo shows how to implement resource-based authorization using the <code>authorizationCallback</code> parameter.</p>
    <ul>
        <li><strong>Document 1 (Public Report):</strong> Accessible to all users with 'read' permission</li>
        <li><strong>Document 4 (Admin Configuration):</strong> Only accessible to Audrey Horne (admin)</li>
    </ul>
    <p>Try clicking on different documents below and switch users using the Toggle button in the header!</p>
</div>

<h2>Available Documents</h2>

<div class="documents-grid">
    {#each documents as doc}
        <div class="document-card {canAccess(doc.id) ? 'accessible' : 'restricted'}">
            <div class="doc-header">
                <h3>{doc.title}</h3>
                <span class="doc-status {doc.status.toLowerCase().replace(' ', '-')}">{doc.status}</span>
            </div>
            <div class="doc-info">
                <p><strong>Owner:</strong> {doc.owner}</p>
                <p><strong>Document ID:</strong> {doc.id}</p>
            </div>
            <div class="doc-access">
                {#if canAccess(doc.id)}
                    <span class="access-badge allowed">✓ You have access</span>
                    <button onclick={() => {
                        const returnTo = location()
                        const returnQuery = querystring()
                        // push(route, routeParams, queryString, navigationContext)
                        push(`/document/${doc.id}`, {}, {}, { returnTo, returnQuery })
                    }}>
                        View Document
                    </button>
                {:else}
                    <span class="access-badge denied">✗ Access denied</span>
                    <button onclick={() => attemptAccess(doc)} class="try-access">
                        Try to Access (will redirect)
                    </button>
                {/if}
            </div>
        </div>
    {/each}
</div>

<div class="code-example">
    <h2>Implementation Example</h2>
    <pre><code>// In routes definition
import &#123; createProtectedRoute &#125; from '@keenmate/svelte-spa-router/helpers/permissions'
import &#123; hasDocumentAccess &#125; from './stores/userStore'
import &#123; push &#125; from '@keenmate/svelte-spa-router'

const routes = &#123;
  '/document/:id': createProtectedRoute(&#123;
    component: () => import('./DocumentEditor.svelte'),
    // Role-based: User must have read permission
    permissions: &#123; any: ['read'] &#125;,
    // Resource-based: User must have access to THIS document
    authorizationCallback: async (detail) => &#123;
      const documentId = detail.params.id
      const hasAccess = hasDocumentAccess(documentId)

      if (!hasAccess) &#123;
        await push('/unauthorized', &#123;
          resource: 'document',
          id: documentId
        &#125;)
        return false
      &#125;

      return true
    &#125;
  &#125;)
&#125;</code></pre>
</div>

<p><a href="/" use:link>← Back to Home</a></p>

<style>
.user-info {
    background: #e3f2fd;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border-left: 4px solid #2196f3;
}

.user-info h2 {
    margin-top: 0;
    color: #1976d2;
}

.info-box {
    background: #fff3e0;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border-left: 4px solid #ff9800;
}

.info-box h3 {
    margin-top: 0;
    color: #f57c00;
}

.info-box ul {
    margin: 0.5rem 0;
}

.documents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}

.document-card {
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.3s;
}

.document-card.accessible {
    border-color: #4caf50;
    background: #f1f8f4;
}

.document-card.restricted {
    border-color: #f44336;
    background: #fef5f5;
}

.document-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.doc-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 1rem;
}

.doc-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
}

.doc-status {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.doc-status.open { background: #4caf50; color: white; }
.doc-status.restricted { background: #f44336; color: white; }

.doc-info {
    margin: 1rem 0;
    font-size: 0.9rem;
    color: #666;
}

.doc-info p {
    margin: 0.25rem 0;
}

.doc-access {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.access-badge {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.9rem;
    text-align: center;
}

.access-badge.allowed {
    background: #4caf50;
    color: white;
}

.access-badge.denied {
    background: #f44336;
    color: white;
}

button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.document-card.accessible button {
    background: #4caf50;
    color: white;
}

.document-card.accessible button:hover {
    background: #45a049;
}

.try-access {
    background: #ff9800;
    color: white;
}

.try-access:hover {
    background: #fb8c00;
}

.code-example {
    background: #f5f5f5;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 2rem 0;
}

.code-example h2 {
    margin-top: 0;
}

.code-example pre {
    background: #2d2d2d;
    color: #f8f8f2;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
}

.code-example code {
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
}
</style>
