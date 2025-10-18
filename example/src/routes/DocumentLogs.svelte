<script>
import { onMount } from 'svelte'
import { link } from '@keenmate/svelte-spa-router/utils'
import { updateBreadcrumb, updateTitle } from '@keenmate/svelte-spa-router/helpers/route-metadata'
import PageWrapper from '../components/PageWrapper.svelte'
import Breadcrumbs from '../components/Breadcrumbs.svelte'

let { params } = $props()

let document = $state(null)
let logs = $state([])
let loading = $state(true)

// Simulate fetching document and logs
async function fetchData(id) {
  await new Promise(resolve => setTimeout(resolve, 800))

  const documents = {
    '1': { id: 1, filename: 'Invoice_Q4_2024.pdf' },
    '2': { id: 2, filename: 'Contract_Template.docx' },
    '3': { id: 3, filename: 'Project_Proposal.pdf' }
  }

  const doc = documents[id]
  if (!doc) return null

  return {
    document: doc,
    logs: [
      { id: 1, action: 'Downloaded', user: 'John Doe', timestamp: '2024-10-15 10:23' },
      { id: 2, action: 'Viewed', user: 'Jane Smith', timestamp: '2024-10-14 15:45' },
      { id: 3, action: 'Shared', user: 'Bob Wilson', timestamp: '2024-10-13 09:12' },
      { id: 4, action: 'Uploaded', user: 'Alice Brown', timestamp: '2024-10-12 14:30' }
    ]
  }
}

onMount(async () => {
  const data = await fetchData(params.id)

  if (data) {
    document = data.document
    logs = data.logs

    // Partial update - only update the dynamic breadcrumb segments
    updateTitle(`${data.document.filename} - Logs`)
    updateBreadcrumb('documentDetail', {
      label: data.document.filename,
      path: `/document/${params.id}`
    })
    updateBreadcrumb('documentLogs', {
      label: 'Logs',
      path: `/document/${params.id}/logs`
    })
  }

  loading = false
})
</script>

<PageWrapper>
  <Breadcrumbs />

  <div class="document-logs">
    {#if loading}
      <p>Loading logs...</p>
    {:else if document}
      <div class="logs-card">
        <h2>Activity Logs</h2>
        <p class="document-name">Document: <strong>{document.filename}</strong></p>

        <div class="logs-table">
          <div class="table-header">
            <div>Action</div>
            <div>User</div>
            <div>Timestamp</div>
          </div>
          {#each logs as log}
            <div class="table-row">
              <div class="action">{log.action}</div>
              <div class="user">{log.user}</div>
              <div class="timestamp">{log.timestamp}</div>
            </div>
          {/each}
        </div>

        <div class="info-box">
          <h3>Partial Breadcrumb Update Example</h3>
          <p>
            This page demonstrates updating <strong>multiple breadcrumb segments</strong> without
            replacing the entire array.
          </p>
          <p>
            Initial breadcrumbs: <code>Home > Documents > Loading... > Loading...</code>
          </p>
          <p>
            After data loads: <code>Home > Documents > {document.filename} > Logs</code>
          </p>
          <p>
            Only the segments with <code>id</code> properties were updated - "Home" and "Documents" stayed the same!
          </p>
        </div>

        <div class="actions">
          <a href={`/document/${params.id}`} use:link class="btn">
            ← Back to Document
          </a>
          <a href="/metadata-demo" use:link class="btn btn-secondary">
            Back to Demo List
          </a>
        </div>
      </div>
    {:else}
      <p>Document not found</p>
    {/if}
  </div>
</PageWrapper>

<style>
.document-logs {
  max-width: 900px;
}

.logs-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.logs-card h2 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 1.75rem;
}

.document-name {
  color: #6b7280;
  margin: 0 0 2rem 0;
}

.logs-table {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.table-header {
  display: grid;
  grid-template-columns: 150px 200px 1fr;
  background: #f9fafb;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.table-row {
  display: grid;
  grid-template-columns: 150px 200px 1fr;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #f9fafb;
}

.action {
  font-weight: 500;
  color: #111827;
}

.user {
  color: #4b5563;
}

.timestamp {
  color: #6b7280;
  font-size: 0.875rem;
}

.info-box {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 1.5rem;
  border-radius: 4px;
  margin-bottom: 2rem;
}

.info-box h3 {
  margin: 0 0 0.75rem 0;
  color: #92400e;
  font-size: 1.125rem;
}

.info-box p {
  margin: 0 0 0.5rem 0;
  color: #92400e;
  line-height: 1.6;
}

.info-box p:last-child {
  margin-bottom: 0;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
}

.btn-secondary:hover {
  background: #4b5563;
}

code {
  background: #fde68a;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.875em;
  color: #92400e;
}
</style>
