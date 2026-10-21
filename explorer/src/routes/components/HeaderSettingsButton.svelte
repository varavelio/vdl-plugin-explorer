<script lang="ts">
  import { Settings } from "@lucide/svelte";
  import { Button, Dialog, Kbd, Select } from "@varavel/ui";
  import { viewport } from "@varavel/ui/runtime";
  import { browser } from "$app/environment";
  import { httpRpcBaseUrl } from "$lib/httpRpc/base-url.svelte";
  import { store } from "$lib/store";

  interface Props {
    alignContent?: "left" | "center";
  }
  let { alignContent = "center" }: Props = $props();

  let open = $state(false);

  /**
   * The dialog only configures the HTTP RPC base URL for now, so the entry
   * point stays hidden when the schema declares no HTTP RPC.
   */
  let hasHttpRpc = $derived(store.ir.rpcs.length > 0);

  /**
   * Show Cmd on Apple platforms and Ctrl elsewhere for the shortcut hint.
   */
  let isMac = $derived(browser && /mac/i.test(navigator.platform ?? ""));

  /**
   * Local selection mirrored into the shared settings on change, so the
   * choice persists across visits.
   */
  let selected = $state(httpRpcBaseUrl.selected);

  $effect(() => {
    httpRpcBaseUrl.select(selected);
  });

  /**
   * Toggle the settings dialog with Ctrl/Cmd+, from anywhere except while
   * typing, so the shortcut never swallows commas from user input.
   */
  function handleKeydown(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key !== "," && event.code !== "Comma") return;
    const target = event.target;
    if (target instanceof HTMLElement) {
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        target.closest(".monaco-editor") !== null
      ) {
        return;
      }
    }
    event.preventDefault();
    open = !open;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if hasHttpRpc}
  <Button
    icon={Settings}
    variant="outline"
    onclick={() => (open = true)}
    {alignContent}
  >
    Settings
    {#if viewport.isDesktop}
      <span class="ml-1 flex items-center gap-1">
        <Kbd size="sm">{isMac ? "\u2318" : "Ctrl"}</Kbd>
        <Kbd size="sm">,</Kbd>
      </span>
    {/if}
  </Button>
{/if}

<Dialog
  bind:open
  size="md"
  title="Settings"
  description="Explorer preferences."
>
  <div class="space-y-4">
    {#if httpRpcBaseUrl.urls.length > 1}
      <Select
        label="HTTP RPC base URL"
        description="Used for procedure URLs, code snippets and executions."
        items={httpRpcBaseUrl.urls.map((url) => ({ value: url, label: url }))}
        bind:value={selected}
      />
    {:else}
      <p class="text-sm text-content-muted">
        There are no extra settings available yet.
      </p>
    {/if}
  </div>
</Dialog>
