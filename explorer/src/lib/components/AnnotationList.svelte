<script lang="ts">
  import { Badge, Card } from "@varavel/ui";
  import type { Annotation } from "@varavel/vdl-plugin-sdk";
  import LiteralValueView from "./LiteralValueView.svelte";

  interface Props {
    annotations: Annotation[];
    compact?: boolean;
  }

  let { annotations, compact = false }: Props = $props();
</script>

{#if compact}
  <div class="flex flex-wrap gap-2">
    {#each annotations as annotation, index (`${annotation.name}-${index}`)}
      <span
        class="inline-flex max-w-full items-center gap-1.5 rounded-full border border-base-400 bg-base-200 px-2.5 py-1 text-xs text-content"
      >
        <span class="font-mono">@{annotation.name}</span>

        {#if annotation.argument}
          <span class="text-content-muted">=</span>
          <LiteralValueView value={annotation.argument} inline />
        {/if}
      </span>
    {/each}
  </div>
{:else}
  <div class="space-y-3">
    {#each annotations as annotation, index (`${annotation.name}-${index}`)}
      <Card bg="100" shadow="none" class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <Badge size="sm" variant="outline">Annotation</Badge>
          <code class="rounded bg-base-300 px-2 py-1 text-sm">
            @{annotation.name}
          </code>

          {#if annotation.argument}
            <Badge size="sm" variant="soft">{annotation.argument.kind}</Badge>
          {/if}
        </div>

        {#if annotation.argument}
          <LiteralValueView value={annotation.argument} />
        {/if}
      </Card>
    {/each}
  </div>
{/if}
