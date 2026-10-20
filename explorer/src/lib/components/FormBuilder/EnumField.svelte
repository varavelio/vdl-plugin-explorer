<script lang="ts">
  import { Trash } from "@lucide/svelte";
  import { Button, Select, Tooltip } from "@varavel/ui";
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

  /**
   * Last parent value seen by the reset effect below. Commits only run
   * while the parent value matches it, so external replacements (delete,
   * clear, history restore) reset the selection instead of being
   * overwritten back.
   */
  let lastSeen: unknown;

  /**
   * Local selection initialized from the parent value on mount. External
   * replacements reset it through the effect below, remount-free.
   */
  function toSelected(external: unknown): string {
    return external === undefined || external === null ? "" : String(external);
  }

  // svelte-ignore state_referenced_locally: initialized once on mount; external changes flow through the reset effect below.
  let selected = $state(toSelected(value));

  $effect(() => {
    const external = value;
    untrack(() => {
      if (Object.is(external, lastSeen)) return;
      lastSeen = external;
      selected = toSelected(external);
    });
  });

  $effect(() => {
    const current = selected;
    untrack(() => {
      if (!Object.is(value, lastSeen)) return;
      const next =
        current === ""
          ? ""
          : definition?.enumType === "int"
            ? Number(current)
            : current;
      if (!Object.is(value, next)) {
        lastSeen = next;
        onChange(next);
      }
    });
  });
</script>

<div>
  <div class="mb-1 flex items-center justify-between gap-2">
    <FieldTitle name={field.name} optional={field.optional} />
    <div class="flex items-center">
      {#if onRemove}
        <Tooltip content={`Delete ${field.name}`} side="left">
          <Button
            size="sm"
            variant="ghost"
            square
            icon={Trash}
            onclick={onRemove}
            aria-label={`Delete ${field.name}`}
          />
        </Tooltip>
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
