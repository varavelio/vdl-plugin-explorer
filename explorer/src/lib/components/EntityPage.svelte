<script lang="ts">
  import { Badge, CodeBlock, Heading } from "@varavel/ui";
  import { theme as runtimeTheme } from "@varavel/ui/runtime";
  import type { Snippet } from "svelte";
  import { highlighter } from "$lib/helpers/shiki";
  import MarkdownContent from "./MarkdownContent.svelte";

  interface Props {
    title: string;
    tags?: string[];
    doc?: string;
    sourceCode?: string;
    children?: Snippet;
  }

  let { title, tags = [], doc, sourceCode, children }: Props = $props();

  let highlightedHtml: string | undefined = $state(undefined);

  $effect(() => {
    let theme = runtimeTheme.resolved;
    (async () => {
      if (sourceCode) {
        highlightedHtml = await highlighter.highlight(sourceCode, "vdl", theme);
      }
    })();
  });
</script>

<div class="space-y-6">
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

  {#if sourceCode}
    <section class="space-y-4">
      <Heading level="2" size="lg">Source</Heading>
      <CodeBlock
        rawCode={sourceCode}
        {highlightedHtml}
        title="VDL"
        fileName="source.vdl"
        bordered
      />
    </section>
  {/if}

  {@render children?.()}
</div>
