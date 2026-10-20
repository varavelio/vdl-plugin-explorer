<script lang="ts">
  import { BrushCleaning, Trash } from "@lucide/svelte";
  import { Button, Checkbox, Input } from "@varavel/ui";
  import type { Field } from "@varavel/vdl-plugin-sdk";
  import { untrack } from "svelte";
  import FieldDoc from "./FieldDoc.svelte";
  import FieldTitle from "./FieldTitle.svelte";

  interface Props {
    /** Primitive field definition. */
    field: Field;
    /** Current slice of the form value for this field. */
    value: unknown;
    /** Reports an updated slice to the parent node. */
    onChange: (next: unknown) => void;
    /** Removes this field from the parent object, when allowed. */
    onRemove?: () => void;
  }

  let { field, value, onChange, onRemove }: Props = $props();

  const primitive = $derived(field.typeRef.primitiveName ?? "string");
  const isBool = $derived(primitive === "bool");
  const isNumber = $derived(primitive === "int" || primitive === "float");

  let text = $state("");

  $effect(() => {
    const current = text;
    untrack(() => {
      if (isBool) return;
      if (current === "") {
        if (value !== "" && value !== undefined) onChange("");
        return;
      }
      if (isNumber) {
        const parsed =
          primitive === "int"
            ? Number.parseInt(current, 10)
            : Number.parseFloat(current);
        if (!Number.isNaN(parsed) && value !== parsed) onChange(parsed);
        return;
      }
      if (value !== current) onChange(current);
    });
  });

  $effect(() => {
    const external = value;
    untrack(() => {
      if (isBool) return;
      const next =
        typeof external === "string" || typeof external === "number"
          ? String(external)
          : "";
      if (next !== text) text = next;
    });
  });

  let checked = $state(false);

  $effect(() => {
    const current = checked;
    untrack(() => {
      if ((value === true) !== current) onChange(current);
    });
  });

  $effect(() => {
    const external = value === true;
    untrack(() => {
      if (external !== checked) checked = external;
    });
  });

  function clearValue() {
    if (isBool) {
      onChange(false);
      return;
    }
    if (isNumber) {
      text = "0";
      return;
    }
    text = "";
    onChange("");
  }
</script>

<div>
  <div class="mb-1 flex items-center justify-between gap-2">
    <FieldTitle name={field.name} optional={field.optional} />
    <div class="flex items-center">
      <Button
        size="sm"
        variant="ghost"
        square
        icon={BrushCleaning}
        onclick={clearValue}
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

  {#if isBool}
    <Checkbox label="Enabled" bind:checked />
  {:else}
    <Input
      type={isNumber ? "number" : "text"}
      step={primitive === "float" ? 0.01 : undefined}
      bind:value={text}
      placeholder={`Enter ${field.name} here...`}
    />
  {/if}

  <FieldDoc doc={field.doc} />
</div>
