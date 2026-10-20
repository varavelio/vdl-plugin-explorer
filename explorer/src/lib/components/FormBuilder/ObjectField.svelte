<script lang="ts">
  import { BrushCleaning, Trash } from "@lucide/svelte";
  import { Button, Card } from "@varavel/ui";
  import type { EnumDef, Field, TypeDef } from "@varavel/vdl-plugin-sdk";
  import FieldDoc from "./FieldDoc.svelte";
  import FieldNode from "./FieldNode.svelte";
  import FieldTitle from "./FieldTitle.svelte";

  interface Props {
    /** Object field definition. */
    field: Field;
    /** Named types used to expand `type` references. */
    types: TypeDef[];
    /** Named enums used to render `enum` selects. */
    enums: EnumDef[];
    /** Type names expanded above this node, guarding recursive types. */
    seen: string[];
    /** Current slice of the form value for this field. */
    value: unknown;
    /** Reports an updated slice to the parent node. */
    onChange: (next: unknown) => void;
    /** Removes this field from the parent object, when allowed. */
    onRemove?: () => void;
  }

  let { field, types, enums, seen, value, onChange, onRemove }: Props =
    $props();

  const childSeen = $derived(
    field.typeRef.kind === "type" && field.typeRef.typeName
      ? [...seen, field.typeRef.typeName]
      : seen,
  );

  /**
   * Bumped on clear so children remount from the emptied object instead of
   * reconciling stale drafts.
   */
  let rev = $state(0);

  let object = $derived(
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {},
  );

  function updateChild(name: string, next: unknown) {
    onChange({ ...object, [name]: next });
  }

  function removeChild(name: string) {
    const next = { ...object };
    delete next[name];
    onChange(next);
  }

  function clearObject() {
    onChange({});
    rev += 1;
  }
</script>

<Card>
  <div class="mb-1 flex items-center justify-between gap-2">
    <FieldTitle name={field.name} optional={field.optional} />
    <div class="flex items-center">
      <Button
        size="sm"
        variant="ghost"
        square
        icon={BrushCleaning}
        onclick={clearObject}
        aria-label={`Clear ${field.name}`}
      />
      {#if onRemove}
        <Button
          size="sm"
          variant="ghost"
          square
          icon={Trash}
          onclick={onRemove}
          aria-label={`Delete ${field.name}`}
        />
      {/if}
    </div>
  </div>

  <FieldDoc doc={field.doc} />

  {#key rev}
    <div class="mt-2 space-y-4">
      {#each field.typeRef.objectFields ?? [] as childField (childField.name)}
        <FieldNode
          field={childField}
          {types}
          {enums}
          seen={childSeen}
          value={object[childField.name]}
          onChange={(next) => updateChild(childField.name, next)}
          onRemove={() => removeChild(childField.name)}
        />
      {/each}
    </div>
  {/key}
</Card>
