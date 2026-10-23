<script lang="ts">
  import { BrushCleaning, Trash } from "@lucide/svelte";
  import { Button, Tooltip } from "@varavel/ui";
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
    /** Nesting depth for styling only; nested objects render as guided groups. */
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
          onclick={clearObject}
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
    </div>
  </div>

  <FieldDoc doc={field.doc} />
{/snippet}

{#snippet body()}
  {#key rev}
    <div class="mt-2 space-y-4 border-l-2 border-dashed border-base-400 pl-4">
      {#each field.typeRef.objectFields ?? [] as childField (childField.name)}
        <FieldNode
          field={childField}
          {types}
          {enums}
          seen={childSeen}
          depth={depth + 1}
          railed
          value={object[childField.name]}
          onChange={(next) => updateChild(childField.name, next)}
          onRemove={() => removeChild(childField.name)}
        />
      {/each}
    </div>
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
