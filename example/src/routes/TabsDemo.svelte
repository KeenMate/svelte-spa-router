<script>
  import { onMount, tick } from "svelte";
  import { replace, querystring } from "@keenmate/svelte-spa-router";
  import { query } from "@keenmate/svelte-spa-router/helpers/querystring";
  import {
    hideLoading,
    updateBreadcrumb,
    updateTitle,
  } from "@keenmate/svelte-spa-router/helpers/route-metadata";
  import PageWrapper from "../components/PageWrapper.svelte";
  import Breadcrumbs from "../components/Breadcrumbs.svelte";

  let { routeParams = {} } = $props();

  // Parse query string reactively
  const qsParams = $derived(query());
  const selectedTab = $derived(qsParams.tab || "overview");

  let item = $state(null);
  let error = $state(null);

  // Simulate fetching item data from server
  async function fetchItem(id) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const items = {
      "1": { id: 1, name: "Project Alpha", status: "Active", description: "Main project for Q4" },
      "2": { id: 2, name: "Project Beta", status: "Draft", description: "Experimental features" },
    };

    return items[id] || null;
  }

  // Handle tab changes - use replace() to update querystring without resetting breadcrumbs
  function handleTabChange(tabId) {
    if (tabId !== selectedTab) {
      // IMPORTANT: Use replace() instead of push() to:
      // 1. Avoid adding history entries for each tab change
      // 2. Preserve the current breadcrumb state (no reset to "Loading...")
      replace(`/tabs/${routeParams.id}`, {}, { tab: tabId });
    }
  }

  onMount(async () => {
    try {
      error = null;
      const data = await fetchItem(routeParams.id);

      if (!data) {
        throw new Error("Item not found");
      }

      item = data;

      // Update breadcrumb with real data
      updateTitle(data.name);
      updateBreadcrumb("itemName", {
        label: data.name,
        path: `/tabs/${routeParams.id}`,
      });

      await tick();
    } catch (err) {
      error = err.message;
      await tick();
    } finally {
      hideLoading();
    }
  });
</script>

<PageWrapper>
  <Breadcrumbs />
  <div class="tabs-demo">
    {#if error}
      <div class="alert alert-danger">
        <strong>Error:</strong> {error}
      </div>
    {:else if item}
      <div class="card">
        <h2>{item.name}</h2>

        <!-- Tab Navigation -->
        <div class="tabs">
          <button
            class="tab"
            class:active={selectedTab === "overview"}
            onclick={() => handleTabChange("overview")}
          >
            Overview
          </button>
          <button
            class="tab"
            class:active={selectedTab === "settings"}
            onclick={() => handleTabChange("settings")}
          >
            Settings
          </button>
          <button
            class="tab"
            class:active={selectedTab === "history"}
            onclick={() => handleTabChange("history")}
          >
            History
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          {#if selectedTab === "overview"}
            <div class="tab-panel">
              <h3>Overview</h3>
              <p><strong>Status:</strong> {item.status}</p>
              <p><strong>Description:</strong> {item.description}</p>
            </div>
          {:else if selectedTab === "settings"}
            <div class="tab-panel">
              <h3>Settings</h3>
              <p>Configuration options for {item.name}</p>
              <p>Notice the URL changes to <code>?tab=settings</code> but the breadcrumb stays as "{item.name}"</p>
            </div>
          {:else if selectedTab === "history"}
            <div class="tab-panel">
              <h3>History</h3>
              <p>Activity log for {item.name}</p>
              <p>Current query string: <code>{querystring()}</code></p>
            </div>
          {/if}
        </div>

        <!-- Info Box -->
        <div class="info-box">
          <h3>Tabs with Query String Pattern</h3>
          <p>
            This demo shows the correct pattern for tabs that use query string for state.
          </p>
          <ul>
            <li>Tab state is stored in URL: <code>?tab=settings</code></li>
            <li>Use <code>replace()</code> instead of <code>push()</code> to change tabs</li>
            <li>Breadcrumbs are preserved when only query string changes</li>
            <li>Use <code>query()</code> helper to parse the query string reactively</li>
          </ul>
          <p>
            <strong>Key code:</strong>
          </p>
          <pre><code>// Handle tab change without resetting breadcrumbs
function handleTabChange(tabId) {"{"}
  replace(`/tabs/${"{"}routeParams.id{"}"}`, {"{"}{"}"}, {"{"} tab: tabId {"}"});
{"}"}</code></pre>
        </div>
      </div>
    {/if}
  </div>
</PageWrapper>

<style>
  .tabs-demo {
    max-width: 800px;
  }

  .card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .card h2 {
    margin: 0 0 1.5rem 0;
    color: #111827;
    font-size: 1.75rem;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 2px solid #e5e7eb;
    margin-bottom: 1.5rem;
  }

  .tab {
    padding: 0.75rem 1.5rem;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1rem;
    color: #6b7280;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
  }

  .tab:hover {
    color: #3b82f6;
  }

  .tab.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
    font-weight: 500;
  }

  .tab-content {
    min-height: 150px;
  }

  .tab-panel h3 {
    margin: 0 0 1rem 0;
    color: #374151;
  }

  .tab-panel p {
    margin: 0.5rem 0;
    color: #4b5563;
  }

  .info-box {
    margin-top: 2rem;
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    padding: 1.5rem;
    border-radius: 4px;
  }

  .info-box h3 {
    margin: 0 0 0.75rem 0;
    color: #1e40af;
  }

  .info-box p {
    margin: 0.5rem 0;
    color: #1e40af;
    line-height: 1.6;
  }

  .info-box ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
    color: #1e40af;
  }

  .info-box li {
    margin: 0.25rem 0;
  }

  .info-box pre {
    background: #dbeafe;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 0.5rem 0 0 0;
  }

  code {
    background: #dbeafe;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.875em;
    color: #1e40af;
  }

  pre code {
    background: none;
    padding: 0;
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
</style>
