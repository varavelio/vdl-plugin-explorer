<script lang="ts">
  import { BrushCleaning, PackageOpen, Plus, Trash } from "@lucide/svelte";
  import { Button, Input, Tooltip } from "@varavel/ui";
  import type {
    EnumDef,
    Field,
    TypeDef,
    TypeRef,
  } from "@varavel/vdl-plugin-sdk";
  import FieldDoc from "./FieldDoc.svelte";
  import FieldNode from "./FieldNode.svelte";
  import FieldTitle from "./FieldTitle.svelte";
  import { defaultValueForType, type FormSchema } from "./fields";

  interface Props {
    /** Map field definition. */
    field: Field;
    /** Reference describing each map value. */
    valueRef: TypeRef;
    /** Named types used to expand `type` references. */
    types: TypeDef[];
    /** Named enums used to render `enum` selects. */
    enums: EnumDef[];
    /** Type names expanded above this node, guarding recursive types. */
    seen: string[];
    /** Nesting depth for styling only; nested maps render as guided groups. */
    depth?: number;
    /** Current slice of the form value for this field. */
    value: unknown;
    /** Reports an updated slice to the parent node. */
    onChange: (next: unknown) => void;
    /** Removes this field from the parent object, when allowed. */
    onRemove?: () => void;
  }

  let {
    field,
    valueRef,
    types,
    enums,
    seen,
    depth = 0,
    value,
    onChange,
    onRemove,
  }: Props = $props();

  const schema: FormSchema = $derived({ types, enums });

  /**
   * Bumped on clear so entries remount from the emptied map instead of
   * reconciling stale drafts.
   */
  let rev = $state(0);

  let entries = $derived(
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? Object.entries(value as Record<string, unknown>)
      : [],
  );

  function record(): Record<string, unknown> {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  function renameEntry(oldKey: string, nextKey: string) {
    const current = record();
    if (nextKey === oldKey || nextKey === "") return;
    if (nextKey in current) return;
    const next = { ...current };
    next[nextKey] = next[oldKey];
    delete next[oldKey];
    onChange(next);
  }

  function updateEntry(key: string, next: unknown) {
    onChange({ ...record(), [key]: next });
  }

  function removeEntry(key: string) {
    const next = { ...record() };
    delete next[key];
    onChange(next);
  }

  function addEntry() {
    const current = record();
    let index = Object.keys(current).length;
    let key = `key${index}`;
    while (key in current) {
      index += 1;
      key = `key${index}`;
    }
    onChange({
      ...current,
      [key]: defaultValueForType(valueRef, schema, seen),
    });
  }

  function clearMap() {
    onChange({});
    rev += 1;
  }
</script>

{#snippet header()}
  <div class="mb-1 flex items-center justify-between gap-2">
    <FieldTitle name={field.name} optional={field.optional} />
    <div class="flex items-center">
      <Tooltip content={`Clear ${field.name}`} side="left">
        <Button
          size="sm"
          variant="ghost"
          square
          icon={BrushCleaning}
          onclick={clearMap}
          aria-label={`Clear ${field.name}`}
        />
      </Tooltip>
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
      <Tooltip content={`Add entry to ${field.name}`} side="left">
        <Button
          size="sm"
          variant="ghost"
          square
          icon={Plus}
          onclick={addEntry}
          aria-label={`Add entry to ${field.name}`}
        />
      </Tooltip>
    </div>
  </div>

  <FieldDoc doc={field.doc} />
{/snippet}

{#snippet body()}
  {#key rev}
    {#if entries.length === 0}
      <div class="flex flex-col items-center gap-1 py-2">
        <PackageOpen class="size-6 text-content-muted" />
        <p class="text-sm text-content-muted italic">
          No entries, add one using the button above.
        </p>
      </div>
    {/if}

    <div class="mt-2 space-y-4">
      {#each entries as [key, entryValue] (key)}
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <div class="flex-1">
              <Input
                value={key}
                oninput={(event) =>
                  renameEntry(key, (event.target as HTMLInputElement).value)}
                placeholder="Entry key..."
              />
            </div>
            <Tooltip content={`Delete entry ${key}`} side="left">
              <Button
                size="sm"
                variant="ghost"
                square
                icon={Trash}
                onclick={() => removeEntry(key)}
                aria-label={`Delete entry ${key}`}
              />
            </Tooltip>
          </div>
          <FieldNode
            field={{
              ...field,
              doc: undefined,
              name: `${field.name}.${key}`,
              typeRef: valueRef,
            }}
            {types}
            {enums}
            {seen}
            depth={depth + 1}
            value={entryValue}
            onChange={(next) => updateEntry(key, next)}
          />
        </div>
      {/each}
    </div>
  {/key}
{/snippet}

{#if depth === 0}
  <div>
    {@render header()}
    {@render body()}
  </div>
{:else}
  <div class="border-l-2 border-dashed border-base-400 pl-4">
    {@render header()}
    {@render body()}
  </div>
{/if}
