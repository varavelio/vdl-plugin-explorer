<script lang="ts">
  import {
    BrushCleaning,
    CodeXml,
    Copy,
    History,
    Loader,
    Zap,
  } from "@lucide/svelte";
  import { Button, Heading, Kbd, Tooltip } from "@varavel/ui";
  import { clipboard, viewport } from "@varavel/ui/runtime";
  import { untrack } from "svelte";
  import { browser } from "$app/environment";
  import FormBuilder from "$lib/components/FormBuilder/FormBuilder.svelte";
  import MonacoEditor from "$lib/components/MonacoEditor/MonacoEditor.svelte";

  import { store } from "$lib/store";
  import {
    formatDurationMs,
    type ProcPlaygroundState,
  } from "$lib/store/httpRpcPlayground";
  import type { RichIrSchemaHttpRpcProc } from "$lib/store/ir/index";
  import HistoryDialog from "./HistoryDialog.svelte";
  import OutputQuickActions from "./OutputQuickActions.svelte";

  interface Props {
    /** Procedure executed by this playground. */
    proc: RichIrSchemaHttpRpcProc;
    /** Shared state, also feeding the snippets aside. */
    playground: ProcPlaygroundState;
    /** Full procedure URL for requests and snippets. */
    endpoint: string;
    /** Headers sent with every request. */
    requestHeaders: Record<string, string>;
    /** Open the snippets modal on mobile. */
    onSnippetsToggle: () => void;
  }

  let {
    proc,
    playground = $bindable(),
    endpoint,
    requestHeaders,
    onSnippetsToggle,
  }: Props = $props();

  let inputFields = $derived(
    proc.sourceIr.typeRef.kind === "object"
      ? (proc.sourceIr.typeRef.objectFields?.find(
          (field) => field.name === "input",
        )?.typeRef.objectFields ?? [])
      : [],
  );

  // Persist every input change so unexecuted edits survive reloads and
  // navigation.
  //
  // note: writes stay immediate because a debounce window loses the edits made
  // just before the page unloads, when pending timers never run. Each keystroke
  // costs one IndexedDB write; coalesce per animation frame if the payload ever
  // grows enough for that to matter.
  $effect(() => {
    // Track the input deeply; the persisted snapshot is the dependency.
    JSON.stringify(playground.input ?? {});
    untrack(() => {
      playground.persistNow();
    });
  });

  /**
   * Show Cmd on Apple platforms and Ctrl elsewhere for the shortcut hint.
   */
  let isMac = $derived(browser && /mac/i.test(navigator.platform ?? ""));

  let tab = $state("input");

  const PANEL_TABS = [
    { value: "input", label: "Input" },
    { value: "output", label: "Output" },
  ];

  /**
   * Move the active panel with arrow keys, following the tablist pattern
   * with automatic activation.
   */
  function handleTabKeydown(event: KeyboardEvent, index: number) {
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % PANEL_TABS.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + PANEL_TABS.length) % PANEL_TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = PANEL_TABS.length - 1;
    if (next === null) return;
    event.preventDefault();
    tab = PANEL_TABS[next].value;
    const target = event.currentTarget;
    if (target instanceof HTMLElement) {
      target.parentElement
        ?.querySelectorAll<HTMLElement>('[role="tab"]')
        [next]?.focus();
    }
  }

  let historyOpen = $state(false);
  let formRev = $state(0);
  let isExecuting = $state(false);
  let cancelRequest = $state(() => {});

  async function executeProcedure() {
    if (isExecuting) return;
    isExecuting = true;
    playground.setOutput("");

    const started = performance.now();
    try {
      tab = "output";
      const controller = new AbortController();
      cancelRequest = () => controller.abort();

      const response = await fetch(endpoint, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(playground.input ?? {}),
        signal: controller.signal,
      });

      const data: unknown = await response.json();
      const durationMs = Math.round(performance.now() - started);
      playground.setOutput(JSON.stringify(data, null, 2), durationMs);
      playground.saveCurrentToHistory({
        url: endpoint,
        headers: requestHeaders,
        durationMs,
      });
    } catch (error) {
      // Cancelled requests stay out of the history; every other failure is
      // recorded like a success so the request can be inspected later.
      if (!(error instanceof Error && error.name === "AbortError")) {
        const durationMs = Math.round(performance.now() - started);
        playground.setOutput(
          JSON.stringify({ error: String(error) }, null, 2),
          durationMs,
        );
        playground.saveCurrentToHistory({
          url: endpoint,
          headers: requestHeaders,
          durationMs,
        });
      }
    } finally {
      isExecuting = false;
      cancelRequest = () => {};
    }
  }

  /**
   * Execute from the input editors only. The output editors and the rest of
   * the page keep their own keys, so a stray shortcut never fires a request.
   *
   * Runs on the capture phase because Monaco stops the keydown from bubbling
   * out of its editors, which would otherwise swallow the shortcut.
   */
  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter" || (!event.ctrlKey && !event.metaKey)) return;
    const target = event.target;
    if (
      !(target instanceof HTMLElement) ||
      target.closest("[data-playground-input]") === null
    ) {
      return;
    }
    event.preventDefault();
    void executeProcedure();
  }

  /**
   * Copy the output with runtime toast feedback on success or failure.
   */
  async function copyOutput() {
    if (!playground.output) return;
    await clipboard.copy(playground.output);
  }
</script>

{#snippet inputTab()}
  <div data-playground-input>
    {#if !playground.restored}
      <p class="text-sm text-content-muted">Restoring the saved input…</p>
    {:else if inputFields.length > 0}
      <FormBuilder
        fields={inputFields}
        types={store.ir.types}
        enums={store.ir.enums}
        resetKey={formRev}
        bind:value={playground.input}
      />
    {:else}
      <p class="text-sm text-content-muted">
        This procedure does not require any input.
      </p>
    {/if}

    <div class="mt-4 flex w-full justify-end gap-2">
      <Tooltip content={shortcutTip} side="top" disabled={!viewport.isDesktop}>
        <Button
          size="sm"
          icon={isExecuting ? Loader : Zap}
          loading={isExecuting}
          disabled={isExecuting}
          onclick={() => void executeProcedure()}
        >
          Execute procedure
        </Button>
      </Tooltip>
    </div>
  </div>
{/snippet}

{#snippet outputTab()}
  {#if isExecuting && !playground.output}
    <div class="flex flex-col items-center gap-2 py-12">
      <Loader class="size-8 animate-spin text-content-muted" />
      <p class="text-sm text-content-muted">Executing procedure…</p>
      <Button size="sm" variant="ghost" onclick={() => cancelRequest()}>
        Cancel request
      </Button>
    </div>
  {:else if !playground.output}
    <p class="py-12 text-center text-sm text-content-muted">
      Execute the procedure from the input tab to see the output.
    </p>
  {:else}
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs text-content-muted">
        {playground.outputDate}
        {playground.durationMs !== null
          ? ` • ${formatDurationMs(playground.durationMs)}`
          : ""}
      </span>
      <div class="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          icon={Copy}
          onclick={() => void copyOutput()}
        >
          Copy
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={BrushCleaning}
          onclick={() => playground.clearOutput()}
        >
          Clear
        </Button>
      </div>
    </div>
    <OutputQuickActions output={playground.output} />
    <div class="mt-4">
      <MonacoEditor lang="json" value={playground.output} readOnly />
    </div>
  {/if}
{/snippet}

<svelte:window onkeydowncapture={handleKeydown} />

{#snippet shortcutTip()}
  <span class="flex items-center gap-1">
    <Kbd size="sm">{isMac ? "⌘" : "Ctrl"}</Kbd>
    <Kbd size="sm">Enter</Kbd>
  </span>
{/snippet}

<section class="space-y-4">
  <div class="flex items-center justify-between gap-2">
    <Heading level="2" size="2xl">Try it out</Heading>
    <div class="flex items-center gap-2">
      {#if !viewport.isDesktop}
        <Button
          size="sm"
          variant="outline"
          icon={CodeXml}
          onclick={onSnippetsToggle}
        >
          Snippets
        </Button>
      {/if}
      <Button
        size="sm"
        variant="outline"
        icon={History}
        onclick={() => (historyOpen = true)}
      >
        History
      </Button>
    </div>
  </div>

  <div
    role="tablist"
    aria-label="Playground panels"
    class="flex divide-x divide-base-400 overflow-hidden rounded-md border border-base-400"
  >
    {#each PANEL_TABS as item, index (item.value)}
      <Button
        size="sm"
        variant={tab === item.value ? "solid" : "ghost"}
        class="flex-1 rounded-none border-0"
        role="tab"
        aria-selected={tab === item.value}
        tabindex={tab === item.value ? 0 : -1}
        onclick={() => (tab = item.value)}
        onkeydown={(event) => handleTabKeydown(event, index)}
      >
        {#if item.value === "output" && isExecuting}
          <Loader class="size-4 animate-spin" aria-hidden="true" />
        {/if}
        {item.label}
      </Button>
    {/each}
  </div>

  <div role="tabpanel" class="pt-4">
    {#if tab === "input"}
      {@render inputTab()}
    {:else}
      {@render outputTab()}
    {/if}
  </div>
</section>

<HistoryDialog
  {playground}
  bind:open={historyOpen}
  onRestored={() => {
    formRev += 1;
  }}
/>
