<script lang="ts">
  import { Plus, Settings, Trash } from "@lucide/svelte";
  import {
    Button,
    Checkbox,
    Dialog,
    Input,
    Kbd,
    Select,
    Tooltip,
  } from "@varavel/ui";
  import { viewport } from "@varavel/ui/runtime";
  import { browser } from "$app/environment";
  import { store } from "$lib/store";

  interface Props {
    alignContent?: "left" | "center";
  }
  let { alignContent = "center" }: Props = $props();

  let open = $state(false);

  /**
   * The dialog only configures HTTP RPC preferences for now, so the entry
   * point stays hidden when the schema declares no HTTP RPC.
   */
  let hasHttpRpc = $derived(store.ir.rpcs.length > 0);

  /**
   * Show Cmd on Apple platforms and Ctrl elsewhere for the shortcut hint.
   */
  let isMac = $derived(browser && /mac/i.test(navigator.platform ?? ""));

  /**
   * Local selection synced both ways with the shared settings: user picks
   * flow outward through `selectHttpRpcBaseUrl`, while late arrivals (loaded
   * persistence) are adopted locally without being written back.
   */
  let selected = $state(store.selectedHttpRpcBaseUrl);
  let synced = $state(store.selectedHttpRpcBaseUrl);

  $effect(() => {
    const fromStore = store.selectedHttpRpcBaseUrl;
    if (fromStore !== synced) {
      synced = fromStore;
      selected = fromStore;
    } else if (selected !== synced) {
      synced = selected;
      store.selectHttpRpcBaseUrl(selected);
    }
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
        <Kbd size="sm">{isMac ? "⌘" : "Ctrl"}</Kbd>
        <Kbd size="sm">,</Kbd>
      </span>
    {/if}
  </Button>
{/if}

<Dialog bind:open size="lg" title="Explorer preferences">
  <div class="space-y-4">
    <section class="space-y-3">
      <h3 class="text-sm font-semibold">HTTP RPC settings</h3>

      {#if store.httpRpcUrls.length > 1}
        <Select
          label="Base URL"
          description="Used for procedure URLs, code snippets and executions."
          items={store.httpRpcUrls.map((url) => ({ value: url, label: url }))}
          bind:value={selected}
        />
      {/if}

      <div>
        <p class="text-sm font-medium">Headers</p>
        <p class="text-xs text-content-muted">
          Sent with every procedure execution on top of the JSON defaults.
        </p>

        {#if store.settings.httpRpc.headers.length > 0}
          <div class="mt-2 overflow-x-auto">
            <table class="w-full min-w-135 text-sm">
              <thead>
                <tr class="text-left text-xs text-content-muted">
                  <th class="w-0 pr-2 pb-1"></th>
                  <th class="pr-2 pb-1 font-medium">Name</th>
                  <th class="pr-2 pb-1 font-medium">Value</th>
                  <th class="pr-2 pb-1 font-medium">Description</th>
                  <th class="w-0 pb-1"></th>
                </tr>
              </thead>
              <tbody>
                {#each store.settings.httpRpc.headers as header (header.id)}
                  <tr class="border-t border-base-300">
                    <td class="py-2 pr-2">
                      <Tooltip
                        content={header.enabled
                          ? "Disable header"
                          : "Enable header"}
                        side="left"
                      >
                        <Checkbox bind:checked={header.enabled} />
                      </Tooltip>
                    </td>
                    <td class="py-2 pr-2">
                      <Input
                        size="sm"
                        placeholder="Name"
                        spellcheck={false}
                        bind:value={header.name}
                      />
                    </td>
                    <td class="py-2 pr-2">
                      <Input
                        size="sm"
                        placeholder="Value"
                        spellcheck={false}
                        bind:value={header.value}
                      />
                    </td>
                    <td class="py-2 pr-2">
                      <Input
                        size="sm"
                        placeholder="Description (optional)"
                        spellcheck={false}
                        bind:value={header.description}
                      />
                    </td>
                    <td class="py-2">
                      <Tooltip content="Remove header" side="left">
                        <Button
                          size="sm"
                          variant="ghost"
                          square
                          icon={Trash}
                          onclick={() => store.removeHttpRpcHeader(header.id)}
                          aria-label="Remove header"
                        />
                      </Tooltip>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="mt-2 text-sm text-content-muted">No custom headers yet.</p>
        {/if}

        <div class="mt-2 flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            icon={Plus}
            onclick={() => store.addHttpRpcHeader()}
          >
            Add header
          </Button>
        </div>
      </div>
    </section>
  </div>
</Dialog>
