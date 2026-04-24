<script lang="ts">
  import { Badge, Heading } from "@varavel/ui";
  import type { Snippet } from "svelte";
  import MarkdownContent from "./MarkdownContent.svelte";
  import SectionCard from "./SectionCard.svelte";

  interface Props {
    title: string;
    tags?: string[];
    doc?: string;
    children?: Snippet;
  }

  let { title, tags = [], doc, children }: Props = $props();
</script>

<div class="space-y-6">
  <section class="flex justify-between flex-wrap items-center gap-2">
    <Heading size="2xl">{title}</Heading>

    <div class="flex flex-wrap gap-2">
      {#each tags as tag}
        <Badge size="sm" variant="soft">{tag}</Badge>
      {/each}
    </div>
  </section>

  {#if doc}
    <SectionCard title="Docs"><MarkdownContent content={doc} /></SectionCard>
  {/if}

  {@render children?.()}
</div>
