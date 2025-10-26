<script>
import { routeParams, location, link } from '@keenmate/svelte-spa-router/utils'
import '../main.scss'

// Reactive values from route params
const currentParams = $derived(routeParams())
const currentLocation = $derived(location())

// Sample data for demo links
const users = [
    { id: 'john-doe', name: 'John Doe', role: 'admin' },
    { id: 'jane-smith', name: 'Jane Smith', role: 'editor' },
    { id: 'bob-wilson', name: 'Bob Wilson', role: 'viewer' }
]

const documents = [
    { id: 'report-2024', title: 'Annual Report 2024', type: 'financial' },
    { id: 'roadmap-q1', title: 'Q1 Product Roadmap', type: 'planning' },
    { id: 'analysis-mar', title: 'March Analysis', type: 'analytics' }
]

const projects = [
    { id: 'proj-alpha', name: 'Project Alpha', phase: 'planning' },
    { id: 'proj-beta', name: 'Project Beta', phase: 'development' },
    { id: 'proj-gamma', name: 'Project Gamma', phase: 'testing' }
]

const logTypes = ['activity', 'errors', 'security', 'audit']
</script>

<div class="route-data-demo">
    <h1>Route Parameters Demo</h1>
    <p>Click the links below to see how route parameters are extracted from the URL.</p>

    <div class="current-data">
        <h3>📍 Current Route Data</h3>
        <div class="data-display">
            <div class="data-item">
                <strong>Location:</strong>
                <code>{currentLocation}</code>
            </div>
            <div class="data-item">
                <strong>Parameters:</strong>
                <pre><code>{JSON.stringify(currentParams, null, 2)}</code></pre>
            </div>
        </div>
    </div>

    <div class="demo-section">
        <h2>1️⃣ Single Parameter Routes</h2>
        <p class="route-pattern">Pattern: <code>/route-data-demo/:userId</code></p>

        <div class="links-grid">
            {#each users as user}
                <a href="/route-data-demo/{user.id}" use:link class="demo-link">
                    <div class="link-title">{user.name}</div>
                    <div class="link-subtitle">ID: {user.id}</div>
                    <div class="link-role">{user.role}</div>
                </a>
            {/each}
        </div>
    </div>

    <div class="demo-section">
        <h2>2️⃣ Multiple Parameter Routes</h2>
        <p class="route-pattern">
            Patterns: <code>/route-data-demo/:docId/:versionId</code> (2 params)<br>
            <code>/route-data-demo/:projectId/:taskId/:commentId</code> (3 params)
        </p>

        <div class="links-grid">
            {#each documents as doc}
                <a href="/route-data-demo/{doc.id}/v2.1" use:link class="demo-link">
                    <div class="link-title">{doc.title}</div>
                    <div class="link-subtitle">Document: {doc.id}</div>
                    <div class="link-version">Version: v2.1</div>
                </a>
            {/each}
            {#each projects as project}
                <a href="/route-data-demo/{project.id}/task-42/comment-7" use:link class="demo-link">
                    <div class="link-title">{project.name}</div>
                    <div class="link-subtitle">Project: {project.id}</div>
                    <div class="link-details">Task: task-42 → Comment: comment-7</div>
                </a>
            {/each}
        </div>
    </div>

    <div class="demo-section">
        <h2>3️⃣ Parameters with Static Prefixes</h2>
        <p class="route-pattern">
            Advanced patterns with static prefixes:<br>
            <code>/route-data-demo/project-:projectCode</code><br>
            <code>/route-data-demo/user-:id</code><br>
            <code>/route-data-demo/project-:code/task-:taskId</code>
        </p>

        <div class="compound-links">
            <div class="document-group">
                <h4>🏗️ Static Prefix: project-:projectCode</h4>
                <div class="log-links">
                    <a href="/route-data-demo/project-alpha" use:link class="log-link">
                        Project Alpha
                    </a>
                    <a href="/route-data-demo/project-beta" use:link class="log-link">
                        Project Beta
                    </a>
                    <a href="/route-data-demo/project-gamma" use:link class="log-link">
                        Project Gamma
                    </a>
                </div>
            </div>

            <div class="document-group">
                <h4>👤 Static Prefix: user-:id</h4>
                <div class="log-links">
                    <a href="/route-data-demo/user-1001" use:link class="log-link">
                        User 1001
                    </a>
                    <a href="/route-data-demo/user-2002" use:link class="log-link">
                        User 2002
                    </a>
                    <a href="/route-data-demo/user-3003" use:link class="log-link">
                        User 3003
                    </a>
                </div>
            </div>

            <div class="document-group">
                <h4>🔗 Combined: project-:code/task-:taskId</h4>
                <div class="log-links">
                    <a href="/route-data-demo/project-alpha/task-101" use:link class="log-link">
                        Alpha → Task 101
                    </a>
                    <a href="/route-data-demo/project-beta/task-202" use:link class="log-link">
                        Beta → Task 202
                    </a>
                    <a href="/route-data-demo/project-gamma/task-303" use:link class="log-link">
                        Gamma → Task 303
                    </a>
                </div>
            </div>
        </div>
    </div>

    <div class="usage-example">
        <h3>📖 Code Example</h3>
        <pre><code>{`import { routeParams } from '@keenmate/svelte-spa-router/utils'

// Extract route parameters
const userId = $derived(routeParams()?.userId)
const docId = $derived(routeParams()?.docId)
const taskId = $derived(routeParams()?.taskId)

// Or get all parameters at once
const allParams = $derived(routeParams())

// React to parameter changes
$effect(() => {
  if (userId) {
    console.log('User ID changed:', userId)
    fetchUserData(userId)
  }
})

// Use in API calls
$effect(() => {
  const projectId = routeParams()?.projectId
  const taskId = routeParams()?.taskId

  if (projectId && taskId) {
    fetchTask(projectId, taskId)
  }
})`}</code></pre>
    </div>
</div>
