<script>
  import { onMount, tick } from "svelte";
  import { link } from "@keenmate/svelte-spa-router/utils";
  import {
    hideLoading,
    updateBreadcrumb,
    updateTitle,
  } from "@keenmate/svelte-spa-router/helpers/route-metadata";
  import PageWrapper from "../components/PageWrapper.svelte";
  import Breadcrumbs from "../components/Breadcrumbs.svelte";

  let { params = {} } = $props();

  let document = $state(null);
  let error = $state(null);

  // Simulate fetching document data from server
  async function fetchDocument(id) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate different documents
    const documents = {
      "1": {
        id: 1,
        filename: "Invoice_Q4_2024.pdf",
        type: "Invoice",
        size: "245 KB",
        description: "Quarterly invoice for services rendered in Q4 2024.",
      },
      "2": {
        id: 2,
        filename: "Contract_Template.docx",
        type: "Contract",
        size: "128 KB",
        description: "Standard employment contract template for new hires.",
      },
      "3": {
        id: 3,
        filename: "Project_Proposal.pdf",
        type: "Proposal",
        size: "1.2 MB",
        description:
          "Detailed proposal for the new client project including timeline and budget.",
      },
    };

    return documents[id] || null;
  }

  onMount(async () => {
    try {
      error = null;

      // Fetch the document data
      const data = await fetchDocument(params.id);

      if (!data) {
        throw new Error("Document not found");
      }

      document = data;

      // Partial update - only update the title and the document breadcrumb
      // Much cleaner than replacing the entire breadcrumbs array!
      updateTitle(data.filename);
      updateBreadcrumb("documentDetail", {
        label: data.filename,
        path: `/document/${params.id}`,
      });

      // Wait for DOM to update with the new document content before hiding loading
      await tick();
    } catch (err) {
      error = err.message;
      await tick();
  } finally {
    hideLoading()
  }
  });
</script>

<PageWrapper>
  <Breadcrumbs />
  <div class="document-detail">
    {#if error}
      <div class="alert alert-danger">
        <strong>Error:</strong>
        {error}
      </div>
    {:else if document}
      <div class="document-card">
        <h2>{document.filename}</h2>

        <div class="document-info">
          <div class="info-row">
            <span class="label">Type:</span>
            <span class="value">{document.type}</span>
          </div>
          <div class="info-row">
            <span class="label">Size:</span>
            <span class="value">{document.size}</span>
          </div>
          <div class="info-row">
            <span class="label">ID:</span>
            <span class="value">{document.id}</span>
          </div>
          <div class="info-row">
            <span class="label">Description:</span>
            <span class="value">{document.description}</span>
          </div>
        </div>

        <div class="info-box">
          <h3>Pattern 1: Router-Managed Loading</h3>
          <p>
            This route uses <code>shouldDisplayLoadingOnRouteLoad: true</code>.
            The loading component stays visible until this component calls
            <code>hideLoading()</code> after fetching data.
          </p>
          <p>
            Notice how the browser tab title changed from generic "Document
            Detail" to the actual filename
            <strong>"{document.filename}"</strong> after data loaded.
          </p>
          <p>
            The loading component was provided by the router, keeping the UI
            consistent across the application.
          </p>
        </div>

        <div class="actions">
          <a href={`/document/${params.id}/logs`} use:link class="btn">
            View Activity Logs →
          </a>
          <a href="/metadata-demo" use:link class="btn btn-secondary">
            Back to Demo List
          </a>
        </div>
      </div>
    {/if}
  </div>
</PageWrapper>

<style>
  .document-detail {
    max-width: 800px;
  }

  .document-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .document-card h2 {
    margin: 0 0 1.5rem 0;
    color: #111827;
    font-size: 1.75rem;
  }

  .document-card h3 {
    margin: 0 0 0.75rem 0;
    color: #374151;
    font-size: 1.25rem;
  }

  .document-info {
    background: #f9fafb;
    border-radius: 6px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .info-row {
    display: flex;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-row .label {
    font-weight: 600;
    color: #6b7280;
    min-width: 120px;
  }

  .info-row .value {
    color: #111827;
    flex: 1;
  }

  .info-box {
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    padding: 1.5rem;
    border-radius: 4px;
  }

  .info-box h3 {
    margin-top: 0;
  }

  .info-box p {
    margin: 0 0 0.75rem 0;
    color: #1e40af;
    line-height: 1.6;
  }

  .info-box p:last-child {
    margin-bottom: 0;
  }

  .alert {
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .alert-danger {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
  }

  code {
    background: #e0e7ff;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.875em;
    color: #1e40af;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
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
</style>
