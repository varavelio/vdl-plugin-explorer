<script lang="ts">
  import { Badge, Card, Heading } from "@varavel/ui";
  import type { LiteralValue } from "@varavel/vdl-plugin-sdk";
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import { literalToInlineLabel } from "$lib/helpers/ir";
  import LiteralValueView from "./LiteralValueView.svelte";

  interface Props {
    value: LiteralValue;
    inline?: boolean;
    depth?: number;
  }

  let { value, inline = false, depth = 0 }: Props = $props();

  /**
   * Computes a compact size label for container literals.
   *
   * @param currentValue Literal value to inspect.
   * @returns Size label when applicable.
   */
  function getSizeLabel(currentValue: LiteralValue): string | undefined {
    switch (currentValue.kind) {
      case "object":
        return pluralize("entry", currentValue.objectEntries?.length ?? 0);
      case "array":
        return pluralize("item", currentValue.arrayItems?.length ?? 0);
      default:
        return undefined;
    }
  }
</script>

{#if inline || value.kind === "string" || value.kind === "int" || value.kind === "float" || value.kind === "bool"}
  <span class="inline-flex max-w-full items-center gap-2">
    {#if !inline}
      <Badge size="sm" variant="outline">{value.kind}</Badge>
    {/if}

    <code
      class="max-w-full break-all rounded bg-base-300 px-2 py-1 text-sm whitespace-pre-wrap"
    >
      {literalToInlineLabel(value)}
    </code>
  </span>
{:else if value.kind === "object"}
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <Badge size="sm" variant="outline">Object</Badge>

      {#if getSizeLabel(value)}
        <span class="text-content-muted text-sm">{getSizeLabel(value)}</span>
      {/if}
    </div>

    {#if (value.objectEntries?.length ?? 0) === 0}
      <p class="text-content-muted text-sm">This object has no entries.</p>
    {:else}
      <div class="space-y-3">
        {#each value.objectEntries ?? [] as entry (entry.key)}
          <Card bg={depth > 0 ? "100" : "200"} shadow="none" class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <Heading level="3" size="sm" class="font-mono">
                {entry.key}
              </Heading>
              <Badge size="sm" variant="soft">{entry.value.kind}</Badge>
            </div>

            <div class="border-base-400 pl-4 border-l">
              <LiteralValueView value={entry.value} depth={depth + 1} />
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  </div>
{:else if value.kind === "array"}
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <Badge size="sm" variant="outline">Array</Badge>

      {#if getSizeLabel(value)}
        <span class="text-content-muted text-sm">{getSizeLabel(value)}</span>
      {/if}
    </div>

    {#if (value.arrayItems?.length ?? 0) === 0}
      <p class="text-content-muted text-sm">This array has no items.</p>
    {:else}
      <div class="space-y-3">
        {#each value.arrayItems ?? [] as item, index (`${value.kind}-${index}`)}
          <Card bg={depth > 0 ? "100" : "200"} shadow="none" class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <Heading level="3" size="sm">[{index}]</Heading>
              <Badge size="sm" variant="soft">{item.kind}</Badge>
            </div>

            <div class="border-base-400 pl-4 border-l">
              <LiteralValueView value={item} depth={depth + 1} />
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  </div>
{/if}
