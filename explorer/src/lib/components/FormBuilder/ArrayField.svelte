<script lang="ts">
  import { BrushCleaning, PackageOpen, Plus, Trash } from "@lucide/svelte";
  import { Button, Tooltip } from "@varavel/ui";
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
    /** Array field definition. */
    field: Field;
    /** Reference describing each array item. */
    itemRef: TypeRef;
    /** Named types used to expand `type` references. */
    types: TypeDef[];
    /** Named enums used to render `enum` selects. */
    enums: EnumDef[];
    /** Type names expanded above this node, guarding recursive types. */
    seen: string[];
    /** Nesting depth for styling only; nested arrays render as guided groups. */
    depth?: number;
    /** True when the parent list already indents this node with its own rail. */
    railed?: boolean;
    /** Source spelling shown next to the name, when this is a container. */
    typeAnnotation?: string | null;
    /** Current slice of the form value for this field. */
    value: unknown;
    /** Reports an updated slice to the parent node. */
    onChange: (next: unknown) => void;
    /** Removes this field from the parent object, when allowed. */
    onRemove?: () => void;
  }

  let {
    field,
    itemRef,
    types,
    enums,
    seen,
    depth = 0,
    railed = false,
    typeAnnotation = null,
    value,
    onChange,
    onRemove,
  }: Props = $props();

  const schema: FormSchema = $derived({ types, enums });

  /**
   * Bumped on structural changes so index-keyed items remount from their
   * new positions instead of reconciling stale drafts.
   */
  let rev = $state(0);

  let items = $derived(Array.isArray(value) ? (value as unknown[]) : []);

  function updateItem(index: number, next: unknown) {
    onChange(items.map((item, i) => (i === index ? next : item)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
    rev += 1;
  }

  function addItem() {
    onChange([...items, defaultValueForType(itemRef, schema, seen)]);
  }

  function clearArray() {
    onChange([]);
    rev += 1;
  }
</script>

{#snippet header()}
  <div class="mb-1 flex items-center justify-between gap-2">
    <FieldTitle name={field.name} optional={field.optional} {typeAnnotation} />
    <div class="flex items-center">
      <Tooltip content={`Clear ${field.name}`} side="left">
        <Button
          size="sm"
          variant="ghost"
          square
          icon={BrushCleaning}
          onclick={clearArray}
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
      <Tooltip content={`Add item to ${field.name}`} side="left">
        <Button
          size="sm"
          variant="ghost"
          square
          icon={Plus}
          onclick={addItem}
          aria-label={`Add item to ${field.name}`}
        />
      </Tooltip>
    </div>
  </div>

  <FieldDoc doc={field.doc} />
{/snippet}

{#snippet body()}
  {#key rev}
    {#if items.length === 0}
      <div class="flex flex-col items-center gap-1 py-2">
        <PackageOpen class="size-6 text-content-muted" />
        <p class="text-sm text-content-muted italic">
          No items, add one using the button above.
        </p>
      </div>
    {:else}
      <div class="mt-2 space-y-4 border-l-2 border-dashed border-base-400 pl-4">
        {#each items as item, index (index)}
          <FieldNode
            field={{
              ...field,
              doc: undefined,
              name: `${field.name}[${index}]`,
              typeRef: itemRef,
            }}
            {types}
            {enums}
            {seen}
            depth={depth + 1}
            railed
            value={item}
            onChange={(next) => updateItem(index, next)}
            onRemove={() => removeItem(index)}
          />
        {/each}
      </div>
    {/if}
  {/key}
{/snippet}

{#if depth === 0 || railed}
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
