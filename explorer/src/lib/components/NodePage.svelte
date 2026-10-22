<script lang="ts">
  import { Badge, CodeBlock, Dialog, Heading, Prose } from "@varavel/ui";
  import { theme as runtimeTheme } from "@varavel/ui/runtime";
  import { interceptSourceCodeLinks } from "$lib/helpers/source-code-links";
  import { store } from "$lib/store";
  import type { SourceCode, SourceCodeReference } from "$lib/store/ir/index";

  type SourceCodeDialog = SourceCodeReference & {
    key: string;
    open: boolean;
  };

  interface Props {
    title: string;
    sourceCode?: SourceCode;
    tags?: string[];
    htmlDoc?: string;
  }

  let { title, tags = [], htmlDoc, sourceCode }: Props = $props();

  function pickSourceCode(code?: SourceCode) {
    if (!code) return undefined;
    if (runtimeTheme.resolved === "dark") {
      return code.htmlDark;
    }
    return code.htmlLight;
  }

  let hlSourceCode = $derived(pickSourceCode(sourceCode));

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
    </div>

    {#if htmlDoc}
      <Prose fluid>{@html htmlDoc}</Prose>
    {/if}
  </section>

  {#if sourceCode}
    <section class="space-y-6">
      <Heading level="2" size="2xl">Source</Heading>
      <div use:interceptSourceCodeLinks={linkParams}>
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
</div>

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
