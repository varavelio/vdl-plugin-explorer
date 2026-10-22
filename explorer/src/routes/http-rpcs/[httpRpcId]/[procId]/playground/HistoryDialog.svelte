<script lang="ts">
  import { History, Trash } from "@lucide/svelte";
  import { Button, CodeBlock, Dialog } from "@varavel/ui";
  import {
    formatDurationMs,
    type ProcPlaygroundState,
  } from "$lib/store/httpRpcPlayground";

  interface Props {
    /** Playground owning the history entries. */
    playground: ProcPlaygroundState;
    /** Dialog visibility bound to the parent component. */
    open?: boolean;
    /** Runs after a history entry is restored into the playground. */
    onRestored?: () => void;
  }

  let { playground, open = $bindable(false), onRestored }: Props = $props();

  let selected = $state(null as number | null);

  $effect(() => {
    if (!open) selected = null;
  });

  function removeSelected() {
    if (selected === null) return;
    playground.deleteHistoryItem(selected);
    selected = null;
  }
</script>

<Dialog
  bind:open
  size="md"
  title={selected === null ? "Request history" : "History entry"}
  description={selected === null
    ? "Past executions of this procedure."
    : (playground.history[selected]?.date ?? "")}
>
  {#if selected === null}
    {#if playground.history.length === 0}
      <div class="flex flex-col items-center gap-2 py-8 text-center">
        <History class="size-8 text-content-muted" />
        <p class="text-sm text-content-muted">No history available</p>
      </div>
    {:else}
      <div class="mb-4">
        <Button
          size="sm"
          variant="ghost"
          icon={Trash}
          onclick={() => playground.clearHistory()}
        >
          Clear all history ({playground.history.length})
        </Button>
      </div>

      <ul class="max-h-[50dvh] space-y-2 overflow-y-auto">
        {#each playground.history as item, index (item.date + index)}
          <li>
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 rounded-lg border border-base-300 px-3 py-2 text-left hover:bg-base-200"
              onclick={() => (selected = index)}
            >
              <span class="min-w-0 flex-1">
                <span class="block truncate font-mono text-xs">
                  {item.url || "(unknown url)"}
                </span>
                <span class="mt-0.5 block text-xs text-content-muted">
                  {item.date}
                  {item.durationMs !== null
                    ? ` · ${formatDurationMs(item.durationMs)}`
                    : ""}
                </span>
              </span>
              <span class="shrink-0 text-xs text-content-muted">
                View details
              </span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {:else if playground.history[selected]}
    {@const item = playground.history[selected]}
    <div class="space-y-4">
      <div>
        <p class="text-sm font-medium">URL</p>
        <p class="mt-1 font-mono text-xs break-all">
          {item.url || "(unknown url)"}
        </p>
        {#if item.durationMs !== null}
          <p class="mt-1 text-xs text-content-muted">
            Took{formatDurationMs(item.durationMs)}
          </p>
        {/if}
      </div>
      {#if Object.keys(item.headers).length > 0}
        <CodeBlock
          rawCode={JSON.stringify(item.headers, null, 2)}
          title="Headers"
          fileName="headers.json"
          scrollY={true}
        />
      {/if}
      <CodeBlock
        rawCode={item.input}
        title="Input"
        fileName="input.json"
        scrollY={true}
      />
      <CodeBlock
        rawCode={item.output || "(empty output)"}
        title="Output"
        fileName="output.json"
        scrollY={true}
      />
    </div>
  {/if}

  {#snippet footer()}
    {#if selected !== null && playground.history[selected]}
      {@const item = playground.history[selected]}
      <div class="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onclick={() => {
            playground.setInput(
              JSON.parse(item.input) as Record<string, unknown>,
            );
            onRestored?.();
            selected = null;
            open = false;
          }}
        >
          Restore input
        </Button>
        <Button size="sm" variant="ghost" onclick={() => (selected = null)}>
          Back
        </Button>
        <Button size="sm" variant="ghost" icon={Trash} onclick={removeSelected}>
          Delete entry
        </Button>
      </div>
    {/if}
  {/snippet}
</Dialog>
