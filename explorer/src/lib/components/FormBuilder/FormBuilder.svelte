<script lang="ts">
  import { BrushCleaning } from "@lucide/svelte";
  import { Button, Heading } from "@varavel/ui";
  import type { EnumDef, Field, TypeDef } from "@varavel/vdl-plugin-sdk";
  import FieldNode from "./FieldNode.svelte";

  interface Props {
    /** Top-level fields rendered by the form. */
    fields: Field[];
    /** Named types used to expand `type` references. */
    types?: TypeDef[];
    /** Named enums used to render `enum` selects. */
    enums?: EnumDef[];
    /** Form result bound as JSON-serializable object. */
    value?: Record<string, unknown>;
    /** Optional heading shown above the fields. */
    title?: string;
  }

  let {
    fields,
    types = [],
    enums = [],
    value = $bindable({}),
    title,
  }: Props = $props();

  function updateField(name: string, next: unknown) {
    value = { ...value, [name]: next };
  }

  function removeField(name: string) {
    const next = { ...value };
    delete next[name];
    value = next;
  }

  function clearAll() {
    value = {};
  }
</script>

<div class="space-y-4">
  {#if title}
    <div class="flex items-center justify-between gap-2">
      <Heading level="2" size="lg">{title}</Heading>
      <Button size="sm" variant="ghost" icon={BrushCleaning} onclick={clearAll}>
        Clear
      </Button>
    </div>
  {/if}

  {#each fields as field (field.name)}
    <FieldNode
      {field}
      {types}
      {enums}
      seen={[]}
      value={value[field.name]}
      onChange={(next) => updateField(field.name, next)}
      onRemove={() => removeField(field.name)}
    />
  {/each}

  {#if fields.length === 0}
    <p class="text-sm text-content-muted italic">
      This type defines no fields.
    </p>
  {/if}
</div>
