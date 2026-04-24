<script lang="ts">
  import { Badge, CodeBlock, Heading } from "@varavel/ui";
  import type { Snippet } from "svelte";
  import MarkdownContent from "./MarkdownContent.svelte";
  import SectionCard from "./SectionCard.svelte";

  interface Props {
    title: string;
    tags?: string[];
    doc?: string;
    sourceCode?: string;
    children?: Snippet;
  }

  let { title, tags = [], doc, sourceCode, children }: Props = $props();
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
        title="VDL"
        fileName="source.vdl"
        bordered
      />
    </section>
  {/if}

  {@render children?.()}
</div>
