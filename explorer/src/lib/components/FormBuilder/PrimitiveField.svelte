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

  /**
   * Local draft. Null means untouched since mount, in which case the
   * rendered text always mirrors the parent value. External resets remount
   * this component through keyed blocks, so the draft never needs syncing.
   */
  let text = $state<string | null>(null);

  /**
   * Local boolean state, initialized from the parent value on mount.
   * Toggles commit immediately, so no text-style draft is needed.
   */
  // svelte-ignore state_referenced_locally: initialized once on mount; external resets remount through keyed blocks.
  let checked = $state(value === true);

  $effect(() => {
    const current = checked;
    untrack(() => {
      if ((value === true) !== current) onChange(current);
    });
  });

  /**
   * Render the parent value as text.
   */
  function toText(external: unknown): string {
    if (typeof external === "string" || typeof external === "number") {
      return String(external);
    }
    return "";
  }

  /**
   * Commit a draft to the parent, skipping invalid numbers.
   */
  function commitText(next: string) {
    text = next;
    if (isNumber) {
      if (next.trim() === "") return;
      const parsed =
        primitive === "int"
          ? Number.parseInt(next, 10)
          : Number.parseFloat(next);
      if (Number.isNaN(parsed)) return;
      onChange(parsed);
      return;
    }
    onChange(next);
  }

  function clearValue() {
    text = null;
    if (isBool) {
      checked = false;
      onChange(false);
      return;
    }
    if (isNumber) {
      onChange(0);
      return;
    }
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
      value={text ?? toText(value)}
      oninput={(event) => commitText(event.currentTarget.value)}
      placeholder={`Enter ${field.name} here...`}
    />
  {/if}

  <FieldDoc doc={field.doc} />
</div>
