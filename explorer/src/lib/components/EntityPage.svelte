<script lang="ts">
  import { Badge, Breadcrumbs, Card, Heading } from "@varavel/ui";
  import type { Component, Snippet } from "svelte";
  import MarkdownContent from "./MarkdownContent.svelte";

  interface Props {
    section: string;
    title: string;
    icon?: Component;
    tags?: string[];
    doc?: string;
    children?: Snippet;
  }

  let { section, title, icon, tags = [], doc, children }: Props = $props();
</script>

<Breadcrumbs
  class="w-full bg-base-100 p-4 desk:sticky desk:top-0"
  items={[{ label: section, icon }, { label: title }]}
/>

<div class="space-y-6 p-4 pt-0">
  <section class="flex justify-between flex-wrap items-center gap-2">
    <Heading size="2xl">{title}</Heading>

    <div class="flex flex-wrap gap-2">
      {#each tags as tag}
        <Badge size="sm" variant="soft">{tag}</Badge>
      {/each}
    </div>
  </section>

  {#if doc}
    <section class="space-y-2">
      <Heading level="2" size="lg">Docs</Heading>
      <Card bg="100" shadow="none"><MarkdownContent content={doc} /></Card>
    </section>
  {/if}

  {@render children?.()}
</div>
