<script lang="ts">
  import { Badge, CodeBlock, Heading } from "@varavel/ui";
  import { theme as runtimeTheme } from "@varavel/ui/runtime";
  import type { Snippet } from "svelte";
  import type { RichIrSchemaSourceCode } from "$lib/store/ir/index";
  import MarkdownContent from "./MarkdownContent.svelte";

  interface Props {
    title: string;
    sourceCode: RichIrSchemaSourceCode;
    tags?: string[];
    doc?: string;
    children?: Snippet;
  }

  let { title, tags = [], doc, sourceCode, children }: Props = $props();

  let highlightedHtml = $derived.by(() => {
    if (!sourceCode) return undefined;
    if (runtimeTheme.resolved === "dark") {
      return sourceCode.htmlDark;
    }
    return sourceCode.htmlLight;
  });
</script>

<div class="space-y-10.75">
  <section class="space-y-10.75">
    <div class="flex justify-between flex-wrap items-center gap-2">
      <Heading size="3xl">{title}</Heading>

      <div class="flex flex-wrap gap-2">
        {#each tags as tag}
          <Badge size="sm" variant="soft">{tag}</Badge>
        {/each}
      </div>
    </div>

    {#if doc}
      <MarkdownContent content={doc} />
    {/if}
  </section>

  <section class="space-y-6">
    <Heading level="2" size="2xl">Source</Heading>
    <CodeBlock
      rawCode={sourceCode.raw}
      {highlightedHtml}
      title="VDL"
      fileName="source.vdl"
      bordered
    />
  </section>

  {@render children?.()}
</div>
