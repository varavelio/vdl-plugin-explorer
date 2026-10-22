<script lang="ts">
  import {
    Badge,
    Button,
    CodeBlock,
    Dialog,
    Heading,
    Prose,
  } from "@varavel/ui";
  import { theme as runtimeTheme, viewport } from "@varavel/ui/runtime";
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import { fly } from "svelte/transition";
  import { buildHttpRpcProcUrl } from "$lib/helpers/http-rpc-url";
  import { interceptSourceCodeLinks } from "$lib/helpers/source-code-links";
  import { store } from "$lib/store";
  import { ProcPlaygroundState } from "$lib/store/httpRpcPlayground";
  import type {
    RichIrSchemaHttpRpcProc,
    SourceCode,
    SourceCodeReference,
  } from "$lib/store/ir/index";
  import ProcPlayground from "./playground/ProcPlayground.svelte";
  import SnippetsPanel from "./playground/SnippetsPanel.svelte";

  interface Props {
    httpRpcProc: RichIrSchemaHttpRpcProc;
  }

  let { httpRpcProc }: Props = $props();

  let tags = $derived.by(() => {
    if (!httpRpcProc) return [];

    const nextTags: string[] = ["procedure", httpRpcProc.httpRpcName];

    if (httpRpcProc.annotations.length > 0) {
      nextTags.push(
        pluralize("annotation", httpRpcProc.annotations.length, true),
      );
    }

    return nextTags;
  });

  // Created in `$effect.pre` so navigating between procedures (which
  // reuses this component instance) swaps the state before rendering.
  let playground = $state<ProcPlaygroundState>(
    null as unknown as ProcPlaygroundState,
  );

  $effect.pre(() => {
    playground = new ProcPlaygroundState(
      httpRpcProc.httpRpcName,
      httpRpcProc.name,
    );
  });

  let endpoint = $derived.by(() => {
    return buildHttpRpcProcUrl(
      store.selectedHttpRpcBaseUrl,
      httpRpcProc.httpRpcName,
      httpRpcProc.name,
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

  function pickSourceCode(code?: SourceCode) {
    if (!code) return undefined;
    if (runtimeTheme.resolved === "dark") {
      return code.htmlDark;
    }
    return code.htmlLight;
  }

  let hlHttpRpcInputSourceCode = $derived(
    pickSourceCode(httpRpcProc.inputSourceCode),
  );
  let hlHttpRpcOutputSourceCode = $derived(
    pickSourceCode(httpRpcProc.outputSourceCode),
  );

  type SourceCodeDialog = SourceCodeReference & {
    key: string;
    open: boolean;
  };

  let sourceCodeDialogKey = 0;
  let sourceCodeDialogStack = $state<SourceCodeDialog[]>([]);

  let sourceReferencesByHref = $derived.by(() => {
    const references = new Map<string, SourceCodeReference>();

    for (const reference of store.ir.sourceReferences) {
      references.set(reference.href, reference);
    }

    return references;
  });

  let visibleSourceCodeDialogs = $derived(
    sourceCodeDialogStack.filter((dialog) => dialog.open),
  );

  function openSourceCodeDialog(reference: SourceCodeReference) {
    sourceCodeDialogStack = [
      ...sourceCodeDialogStack.filter((dialog) => dialog.open),
      {
        ...reference,
        key: `${reference.href}-${sourceCodeDialogKey++}`,
        open: true,
      },
    ];
  }

  let linkParams = $derived({
    references: sourceReferencesByHref,
    onOpen: openSourceCodeDialog,
  });

  /**
   * Desktop snippets aside visibility, shared by every proc page and kept
   * across reloads; mobile uses a transient modal instead.
   */
  let snippetsOpen = $derived(store.ui.snippetsOpen);
  let snippetsModalOpen = $state(false);

  function toggleSnippets() {
    if (viewport.isDesktop) {
      store.setSnippetsOpen(!snippetsOpen);
    } else {
      snippetsModalOpen = true;
    }
  }
</script>

<div class="grid grid-cols-1 gap-6 desk:grid-cols-8">
  <div
    class={snippetsOpen
      ? "space-y-8 desk:col-span-5"
      : "space-y-8 desk:col-span-8"}
  >
    <section class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <Heading size="3xl">{httpRpcProc.name}</Heading>

        <div class="flex flex-wrap items-center gap-2">
          {#each tags as tag (tag)}
            <Badge size="sm" variant="soft">{tag}</Badge>
          {/each}
        </div>
      </div>

      <CodeBlock
        rawCode={endpoint}
        title="Endpoint"
        showDownload={false}
        showLoc={false}
        bordered
      />

      {#if httpRpcProc.htmlDoc}
        <Prose fluid>{@html httpRpcProc.htmlDoc}</Prose>
      {/if}
    </section>

    <ProcPlayground
      proc={httpRpcProc}
      bind:playground
      {endpoint}
      {requestHeaders}
      onSnippetsToggle={toggleSnippets}
    />

    {#if httpRpcProc.inputSourceCode}
      <section class="space-y-6">
        <Heading level="2" size="2xl">Input</Heading>
        <div use:interceptSourceCodeLinks={linkParams}>
          <CodeBlock
            rawCode={httpRpcProc.inputSourceCode.raw}
            highlightedHtml={hlHttpRpcInputSourceCode}
            title="VDL"
            fileName="input.vdl"
            bordered
          />
        </div>
      </section>
    {/if}

    {#if httpRpcProc.outputSourceCode}
      <section class="space-y-6">
        <Heading level="2" size="2xl">Output</Heading>
        <div use:interceptSourceCodeLinks={linkParams}>
          <CodeBlock
            rawCode={httpRpcProc.outputSourceCode.raw}
            highlightedHtml={hlHttpRpcOutputSourceCode}
            title="VDL"
            fileName="output.vdl"
            bordered
          />
        </div>
      </section>
    {/if}
  </div>

  {#if viewport.isDesktop && snippetsOpen}
    <aside
      class="hidden desk:col-span-3 desk:block desk:sticky desk:top-15 desk:max-h-[calc(100dvh-10rem)] desk:overflow-y-auto"
      in:fly={{ duration: 200 }}
    >
      <SnippetsPanel
        {endpoint}
        input={playground.input}
        headers={requestHeaders}
        onClose={toggleSnippets}
      />
    </aside>
  {/if}
</div>

{#if !viewport.isDesktop}
  <Dialog bind:open={snippetsModalOpen}>
    <SnippetsPanel
      {endpoint}
      input={playground.input}
      headers={requestHeaders}
    />
  </Dialog>
{/if}

{#each visibleSourceCodeDialogs as dialog (dialog.key)}
  <Dialog
    bind:open={dialog.open}
    size="lg"
    title={dialog.title}
    description={`Source for ${dialog.kind} reference`}
  >
    <div use:interceptSourceCodeLinks={linkParams}>
      <CodeBlock
        rawCode={dialog.sourceCode.raw}
        highlightedHtml={pickSourceCode(dialog.sourceCode)}
        title="VDL"
        fileName="source.vdl"
        bordered
        scrollY
        wrapperClass="max-h-[70dvh]"
      />
    </div>
  </Dialog>
{/each}
