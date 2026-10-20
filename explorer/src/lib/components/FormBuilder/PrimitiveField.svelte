<script lang="ts">
  import {
    getLocalTimeZone,
    parseAbsoluteToLocal,
    toZoned,
    ZonedDateTime,
  } from "@internationalized/date";
  import { BrushCleaning, Trash } from "@lucide/svelte";
  import { Button, DateTimePicker, Input, Switch } from "@varavel/ui";
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
  const isDatetime = $derived(primitive === "datetime");
  const isNumber = $derived(primitive === "int" || primitive === "float");

  /**
   * Local text draft. Null means untouched since mount, in which case the
   * rendered input always mirrors the parent value. External resets remount
   * this component through keyed blocks, so the draft never needs syncing.
   */
  let text = $state<string | null>(null);

  /**
   * Local toggle/selection states, initialized from the parent value on
   * mount. They commit immediately, so no draft is needed. External resets
   * remount this component through keyed blocks.
   */
  // svelte-ignore state_referenced_locally: initialized once on mount; external resets remount through keyed blocks.
  let checked = $state(value === true);
  // svelte-ignore state_referenced_locally: initialized once on mount; external resets remount through keyed blocks.
  let dateValue = $state(parseDateTime(value));

  $effect(() => {
    const current = checked;
    untrack(() => {
      if ((value === true) !== current) onChange(current);
    });
  });

  $effect(() => {
    const current = dateValue;
    untrack(() => {
      // Day picks flow through transient states (briefly empty, then a
      // zone-less calendar date). Committing those would publish stale
      // values one interaction late, so they are skipped and only a
      // normalized zoned date-time reaches the parent.
      if (!current) return;
      const zoned =
        current instanceof ZonedDateTime
          ? current
          : toZoned(current, getLocalTimeZone());
      const next = zoned.toAbsoluteString();
      if (value !== next) onChange(next);
    });
  });

  /**
   * Parse an ISO datetime string into a picker value.
   *
   * @param external Current parent value.
   * @returns Local zoned date-time, or undefined when empty or invalid.
   */
  function parseDateTime(external: unknown) {
    if (typeof external !== "string" || external === "") return undefined;
    try {
      return parseAbsoluteToLocal(external);
    } catch {
      return undefined;
    }
  }

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
   * Commit a text draft to the parent, skipping invalid numbers.
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
    if (isDatetime) {
      const now = parseAbsoluteToLocal(new Date().toISOString());
      dateValue = now;
      onChange(now.toAbsoluteString());
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
    <Switch bind:checked />
  {:else if isDatetime}
    <DateTimePicker granularity="second" bind:value={dateValue} />
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

<style>
  /*
   * note: hides the Clear button in the @varavel/ui date picker popover.
   * The kit offers no prop for this and its own clear only empties the
   * popup without reaching the form value, while the form-level Clear and
   * Delete buttons already cover this. The selector targets the second
   * button of the popover footer (Now is always first), so it degrades to
   * a no-op if the kit markup ever changes.
   */
  :global(
    div.mt-3.flex.items-center.justify-between.gap-3.border-t.border-base-400.pt-3
      > button:nth-child(2)
  ) {
    display: none;
  }
</style>
