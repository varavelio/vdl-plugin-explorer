<script lang="ts">
  import { Trash } from "@lucide/svelte";
  import { Button, Select } from "@varavel/ui";
  import type { EnumDef, Field } from "@varavel/vdl-plugin-sdk";
  import { untrack } from "svelte";
  import FieldDoc from "./FieldDoc.svelte";
  import FieldTitle from "./FieldTitle.svelte";
  import { enumOptions, findEnum } from "./fields";

  interface Props {
    /** Enum field definition. */
    field: Field;
    /** Named enums used to resolve the field reference. */
    enums: EnumDef[];
    /** Current slice of the form value for this field. */
    value: unknown;
    /** Reports an updated slice to the parent node. */
    onChange: (next: unknown) => void;
    /** Removes this field from the parent object, when allowed. */
    onRemove?: () => void;
  }

  let { field, enums, value, onChange, onRemove }: Props = $props();

  let definition = $derived(
    field.typeRef.enumName
      ? findEnum(enums, field.typeRef.enumName)
      : undefined,
  );
  let options = $derived(definition ? enumOptions(definition) : []);
  let selected = $state("");

  $effect(() => {
    const current = selected;
    untrack(() => {
      const next =
        current === ""
          ? ""
          : definition?.enumType === "int"
            ? Number(current)
            : current;
      if (!Object.is(value, next)) onChange(next);
    });
  });

  $effect(() => {
    const external = value === undefined || value === null ? "" : String(value);
    untrack(() => {
      if (external !== selected) selected = external;
    });
  });
</script>

<div>
  <div class="mb-1 flex items-center justify-between gap-2">
    <FieldTitle name={field.name} optional={field.optional} />
    <div class="flex items-center">
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

  {#if definition}
    <Select
      items={options}
      bind:value={selected}
      placeholder={`Select ${field.name}...`}
    />
  {:else}
    <p class="text-sm text-content-muted italic">
      {field.name} references an unknown enum.
    </p>
  {/if}

  <FieldDoc doc={field.doc} />
</div>
