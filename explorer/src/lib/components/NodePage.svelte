<script lang="ts">
  import { Badge, CodeBlock, Dialog, Heading, Prose } from "@varavel/ui";
  import { theme as runtimeTheme } from "@varavel/ui/runtime";
  import { store } from "$lib/store";
  import type { SourceCode, SourceCodeReference } from "$lib/store/ir/index";
  import { INTERNAL_IR_LINK_CLASS } from "$lib/store/ir/shiki-links-transformer";

  type SourceCodeDialog = SourceCodeReference & {
    key: string;
    open: boolean;
  };

  const INTERNAL_SOURCE_LINK_SELECTOR = `a.${INTERNAL_IR_LINK_CLASS}[href]`;

  interface Props {
    title: string;
    sourceCode?: SourceCode;
    rpcInputSourceCode?: SourceCode;
    rpcOutputSourceCode?: SourceCode;
    rpcProcUrl?: string;
    tags?: string[];
    htmlDoc?: string;
  }

  let {
    title,
    tags = [],
    htmlDoc,
    sourceCode,
    rpcInputSourceCode,
    rpcOutputSourceCode,
    rpcProcUrl,
  }: Props = $props();

  function pickSourceCode(code?: SourceCode) {
    if (!code) return undefined;
    if (runtimeTheme.resolved === "dark") {
      return code.htmlDark;
    }
    return code.htmlLight;
  }

  let hlSourceCode = $derived(pickSourceCode(sourceCode));
  let hlRpcInputSourceCode = $derived(pickSourceCode(rpcInputSourceCode));
  let hlRpcOutputSourceCode = $derived(pickSourceCode(rpcOutputSourceCode));

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

  function handleSourceCodeLinkClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;

    const link = event.target.closest(INTERNAL_SOURCE_LINK_SELECTOR);
    if (!(link instanceof HTMLAnchorElement)) return;

    const href = link.getAttribute("href");
    if (!href) return;

    const reference = sourceReferencesByHref.get(href);
    if (!reference) return;

    event.preventDefault();
    event.stopPropagation();
    openSourceCodeDialog(reference);
  }

  function _interceptSourceCodeLinks(node: HTMLElement) {
    node.addEventListener("click", handleSourceCodeLinkClick);

    return {
      destroy() {
        node.removeEventListener("click", handleSourceCodeLinkClick);
      },
    };
  }
</script>

<div class="space-y-10.75">
  <section class="space-y-10.75">
    <div class="space-y-6">
      <div class="flex justify-between flex-wrap items-center gap-2">
        <Heading size="3xl">{title}</Heading>

        <div class="flex flex-wrap gap-2">
          {#each tags as tag (tag)}
            <Badge size="sm" variant="soft">{tag}</Badge>
          {/each}
        </div>
      </div>

      {#if rpcProcUrl}
        <CodeBlock
          rawCode={rpcProcUrl}
          title="Endpoint"
          showDownload={false}
          showLoc={false}
          bordered
        />
      {/if}
    </div>

    {#if htmlDoc}
      <Prose fluid>{@html htmlDoc}</Prose>
    {/if}
  </section>

  {#if sourceCode}
    <section class="space-y-6">
      <Heading level="2" size="2xl">Source</Heading>
      <div use:_interceptSourceCodeLinks>
        <CodeBlock
          rawCode={sourceCode.raw}
          highlightedHtml={hlSourceCode}
          title="VDL"
          fileName="source.vdl"
          bordered
        />
      </div>
    </section>
  {/if}

  {#if rpcInputSourceCode}
    <section class="space-y-6">
      <Heading level="2" size="2xl">Input</Heading>
      <div use:_interceptSourceCodeLinks>
        <CodeBlock
          rawCode={rpcInputSourceCode.raw}
          highlightedHtml={hlRpcInputSourceCode}
          title="VDL"
          fileName="input.vdl"
          bordered
        />
      </div>
    </section>
  {/if}

  {#if rpcOutputSourceCode}
    <section class="space-y-6">
      <Heading level="2" size="2xl">Output</Heading>
      <div use:_interceptSourceCodeLinks>
        <CodeBlock
          rawCode={rpcOutputSourceCode.raw}
          highlightedHtml={hlRpcOutputSourceCode}
          title="VDL"
          fileName="output.vdl"
          bordered
        />
      </div>
    </section>
  {/if}
</div>

{#each visibleSourceCodeDialogs as dialog (dialog.key)}
  <Dialog
    bind:open={dialog.open}
    size="lg"
    title={dialog.title}
    description={`Source for ${dialog.kind} reference`}
  >
    <div use:_interceptSourceCodeLinks>
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
