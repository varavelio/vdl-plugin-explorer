<script lang="ts">
  import { Plus, RefreshCcw, Settings, Trash } from "@lucide/svelte";
  import {
    Button,
    Checkbox,
    Combobox,
    Dialog,
    Input,
    Kbd,
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
  let hasHttpRpc = $derived(store.ir.httpRpcs.length > 0);

  /**
   * Show Cmd on Apple platforms and Ctrl elsewhere for the shortcut hint.
   */
  let isMac = $derived(browser && /mac/i.test(navigator.platform ?? ""));

  /**
   * Local selection synced both ways with the shared settings: user picks
   * flow outward through `selectHttpRpcBaseUrl`, while late arrivals (loaded
   * persistence) are adopted locally without being written back.
   */
  let selected: string | undefined = $state(store.selectedHttpRpcBaseUrl);
  let synced = $state(store.selectedHttpRpcBaseUrl);

  /**
   * Remount token forcing the combobox to drop its internal draft (for
   * example after restoring the default while a draft is present).
   */
  let comboKey = $state(0);

  /**
   * Two-way sync tolerating combobox drafts: an undefined selection means
   * the visitor is still typing, so nothing is pushed or adopted until the
   * value commits. On simultaneous changes the typed value wins over a
   * stale loaded one.
   */
  $effect(() => {
    const fromStore = store.selectedHttpRpcBaseUrl;
    if (selected === undefined) return;
    if (selected !== synced) {
      synced = selected;
      store.selectHttpRpcBaseUrl(selected);
    } else if (fromStore !== synced) {
      synced = fromStore;
      selected = fromStore;
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
  <div class="space-y-6">
    <section class="space-y-4">
      <h3 class="text-sm font-semibold">HTTP RPC settings</h3>

      <div>
        <p class="text-sm font-medium">Base URL</p>
        <div class="mt-2 flex items-start gap-2">
          <div class="min-w-0 flex-1">
            {#key comboKey}
              <Combobox
                placeholder="Select or type a base URL…"
                items={store.httpRpcUrls.map((url) => ({
                  value: url,
                  label: url,
                }))}
                bind:value={selected}
                allowCustomValue
              />
            {/key}
          </div>
          <Tooltip content="Restore default base URL" side="left">
            <Button
              variant="ghost"
              square
              icon={RefreshCcw}
              onclick={() => {
                selected = store.httpRpcUrls[0];
                comboKey += 1;
              }}
              aria-label="Restore default base URL"
            />
          </Tooltip>
        </div>
        <p class="mt-1.5 text-xs text-content-muted">
          Used for URLs, code snippets and procedure executions.
        </p>
      </div>

      <div>
        <p class="text-sm font-medium">Headers</p>
        <p class="mt-1 text-xs text-content-muted">
          Sent with every procedure execution on top of the JSON defaults and in
          the code snippets.
        </p>

        {#if store.settings.httpRpc.headers.length > 0}
          <div class="mt-4 overflow-x-auto">
            <table class="w-full min-w-135 text-sm">
              <thead>
                <tr class="text-left text-xs text-content-muted">
                  <th class="w-0 pr-3 pb-2"></th>
                  <th class="pr-3 pb-2 font-medium">Name</th>
                  <th class="pr-3 pb-2 font-medium">Value</th>
                  <th class="pr-3 pb-2 font-medium">Description</th>
                  <th class="w-0 pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {#each store.settings.httpRpc.headers as header (header.id)}
                  <tr class="border-t border-base-300">
                    <td class="py-2.5 pr-3">
                      <Tooltip
                        content={header.enabled
                          ? "Disable header"
                          : "Enable header"}
                        side="left"
                      >
                        <Checkbox bind:checked={header.enabled} />
                      </Tooltip>
                    </td>
                    <td class="py-2.5 pr-3">
                      <Input
                        size="sm"
                        placeholder="Name"
                        spellcheck={false}
                        bind:value={header.name}
                      />
                    </td>
                    <td class="py-2.5 pr-3">
                      <Input
                        size="sm"
                        placeholder="Value"
                        spellcheck={false}
                        bind:value={header.value}
                      />
                    </td>
                    <td class="py-2.5 pr-3">
                      <Input
                        size="sm"
                        placeholder="Description (optional)"
                        spellcheck={false}
                        bind:value={header.description}
                      />
                    </td>
                    <td class="py-2.5">
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
          <p class="mt-3 text-sm text-content-muted">No custom headers yet.</p>
        {/if}

        <div class="mt-3 flex justify-end">
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
