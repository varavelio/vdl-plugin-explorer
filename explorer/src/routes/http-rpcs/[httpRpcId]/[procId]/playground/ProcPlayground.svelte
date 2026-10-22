<script lang="ts">
  import { History, Loader, Trash, Zap } from "@lucide/svelte";
  import { Button, Heading, Tabs } from "@varavel/ui";
  import { untrack } from "svelte";
  import FormBuilder from "$lib/components/FormBuilder/FormBuilder.svelte";
  import MonacoEditor from "$lib/components/MonacoEditor/MonacoEditor.svelte";

  import { buildHttpRpcProcUrl } from "$lib/helpers/http-rpc-url";
  import { store } from "$lib/store";
  import {
    formatDurationMs,
    ProcPlaygroundState,
  } from "$lib/store/httpRpcPlayground";
  import type { RichIrSchemaHttpRpcProc } from "$lib/store/ir/index";
  import HistoryDialog from "./HistoryDialog.svelte";
  import SnippetsPanel from "./SnippetsPanel.svelte";

  interface Props {
    /** Procedure executed by this playground. */
    proc: RichIrSchemaHttpRpcProc;
  }

  let { proc }: Props = $props();

  let playground = $derived(
    new ProcPlaygroundState(proc.httpRpcName, proc.name),
  );

  let endpoint = $derived.by(() => {
    return buildHttpRpcProcUrl(
      store.selectedHttpRpcBaseUrl,
      proc.httpRpcName,
      proc.name,
    );
  });

  /**
   * Request headers merging the JSON defaults with the enabled custom
   * headers, which win on name matches like the old playground did.
   */
  let requestHeaders = $derived.by(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    for (const header of store.enabledHttpRpcHeaders) {
      headers[header.name.trim()] = header.value;
    }
    return headers;
  });

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

  let tab = $state("input");
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
      if (!(error instanceof Error && error.name === "AbortError")) {
        playground.setOutput(
          JSON.stringify({ error: String(error) }, null, 2),
          Math.round(performance.now() - started),
        );
      }
    } finally {
      isExecuting = false;
      cancelRequest = () => {};
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void executeProcedure();
    }
  }

  async function copyOutput() {
    if (!playground.output) return;
    await navigator.clipboard.writeText(playground.output);
  }
</script>

{#snippet inputTab()}
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
    <Button
      size="sm"
      variant="ghost"
      icon={Trash}
      disabled={isExecuting}
      onclick={() => playground.clearInput()}
    >
      Clear input
    </Button>
    <Button
      size="sm"
      icon={isExecuting ? Loader : Zap}
      loading={isExecuting}
      disabled={isExecuting}
      onclick={() => void executeProcedure()}
    >
      Execute procedure
    </Button>
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
    <MonacoEditor lang="json" value={playground.output} readOnly />
    <div class="mt-2 flex items-center justify-between gap-2">
      <span class="text-xs text-content-muted">
        {playground.outputDate}
        {playground.durationMs !== null
          ? ` · ${formatDurationMs(playground.durationMs)}`
          : ""}
      </span>
      <div class="flex gap-2">
        <Button size="sm" variant="ghost" onclick={() => void copyOutput()}>
          Copy output
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={Trash}
          onclick={() => playground.clearOutput()}
        >
          Clear output
        </Button>
      </div>
    </div>
  {/if}
{/snippet}

<svelte:window onkeydown={handleKeydown} />

<div class="grid grid-cols-1 gap-6 desk:grid-cols-8">
  <section class="space-y-4 desk:col-span-5">
    <div class="flex items-center justify-between gap-2">
      <Heading level="2" size="lg">Try it out</Heading>
      <Button
        size="sm"
        variant="outline"
        icon={History}
        onclick={() => (historyOpen = true)}
      >
        History
      </Button>
    </div>

    <Tabs
      items={[
        { value: "input", label: "Input", content: inputTab },
        { value: "output", label: "Output", content: outputTab },
      ]}
      bind:value={tab}
    />
  </section>

  <aside class="desk:col-span-3">
    <SnippetsPanel
      {endpoint}
      input={playground.input}
      headers={requestHeaders}
    />
  </aside>
</div>

<HistoryDialog
  {playground}
  bind:open={historyOpen}
  onRestored={() => {
    formRev += 1;
  }}
/>
