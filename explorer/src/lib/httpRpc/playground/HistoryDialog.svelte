<script lang="ts">
  import { History, Trash } from "@lucide/svelte";
  import { Button, CodeBlock, Dialog } from "@varavel/ui";
  import type { ProcPlaygroundState } from "./proc-state.svelte";

  interface Props {
    /** Playground owning the history entries. */
    playground: ProcPlaygroundState;
    /** Dialog visibility bound to the parent component. */
    open?: boolean;
  }

  let { playground, open = $bindable(false) }: Props = $props();

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
              <span class="text-sm font-medium">{item.date}</span>
              <span class="text-xs text-content-muted">View details</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {:else if playground.history[selected]}
    {@const item = playground.history[selected]}
    <div class="space-y-4">
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
