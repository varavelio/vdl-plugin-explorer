<script lang="ts">
  import { History, Loader, Trash, Zap } from "@lucide/svelte";
  import { Button, Heading, Tabs } from "@varavel/ui";
  import FormBuilder from "$lib/components/FormBuilder/FormBuilder.svelte";
  import MonacoEditor from "$lib/components/MonacoEditor/MonacoEditor.svelte";
  import { httpRpcBaseUrl } from "$lib/httpRpc/base-url.svelte";
  import { buildRpcProcUrl } from "$lib/httpRpc/url";
  import { store } from "$lib/store";
  import type { RichIrSchemaRpcProc } from "$lib/store/ir/index";
  import HistoryDialog from "./HistoryDialog.svelte";
  import { ProcPlaygroundState } from "./proc-state.svelte";
  import SnippetsPanel from "./SnippetsPanel.svelte";

  interface Props {
    /** Procedure executed by this playground. */
    proc: RichIrSchemaRpcProc;
  }

  let { proc }: Props = $props();

  let playground = $derived(new ProcPlaygroundState(proc.rpcName, proc.name));

  let endpoint = $derived.by(() => {
    return buildRpcProcUrl(httpRpcBaseUrl.selected, proc.rpcName, proc.name);
  });

  let inputFields = $derived(
    proc.sourceIr.typeRef.kind === "object"
      ? (proc.sourceIr.typeRef.objectFields?.find(
          (field) => field.name === "input",
        )?.typeRef.objectFields ?? [])
      : [],
  );

  let tab = $state("input");
  let historyOpen = $state(false);
  let formRev = $state(0);
  let isExecuting = $state(false);
  let cancelRequest = $state(() => {});

  async function executeProcedure() {
    if (isExecuting) return;
    isExecuting = true;
    playground.setOutput("");

    try {
      tab = "output";
      const controller = new AbortController();
      cancelRequest = () => controller.abort();

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(playground.input ?? {}),
        signal: controller.signal,
      });

      const data: unknown = await response.json();
      playground.setOutput(JSON.stringify(data, null, 2));
      playground.saveCurrentToHistory();
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        playground.setOutput(JSON.stringify({ error: String(error) }, null, 2));
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
  {#if inputFields.length > 0}
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
      <span class="text-xs text-content-muted">{playground.outputDate}</span>
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
    <SnippetsPanel {endpoint} input={playground.input} />
  </aside>
</div>

<HistoryDialog
  {playground}
  bind:open={historyOpen}
  onRestored={() => {
    formRev += 1;
  }}
/>
