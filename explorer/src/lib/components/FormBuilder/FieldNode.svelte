<script lang="ts">
  import type {
    EnumDef,
    Field,
    TypeDef,
    TypeRef,
  } from "@varavel/vdl-plugin-sdk";
  import ArrayField from "./ArrayField.svelte";
  import EnumField from "./EnumField.svelte";
  import {
    describeFieldType,
    expandNamedField,
    type FormSchema,
  } from "./fields";
  import MapField from "./MapField.svelte";
  import ObjectField from "./ObjectField.svelte";
  import PrimitiveField from "./PrimitiveField.svelte";

  interface Props {
    /** Field definition rendered by this node. */
    field: Field;
    /** Named types used to expand `type` references. */
    types: TypeDef[];
    /** Named enums used to render `enum` selects. */
    enums: EnumDef[];
    /** Type names expanded above this node, guarding recursive types. */
    seen: string[];
    /** Nesting depth for styling only; containers group children when nested. */
    depth?: number;
    /** True when the parent list already indents this node with its own rail. */
    railed?: boolean;
    /** Current slice of the form value for this field. */
    value: unknown;
    /** Reports an updated slice to the parent node. */
    onChange: (next: unknown) => void;
    /** Removes this field from the parent object, when allowed. */
    onRemove?: () => void;
  }

  let {
    field: originalField,
    types,
    enums,
    seen,
    depth = 0,
    railed = false,
    value,
    onChange,
    onRemove,
  }: Props = $props();

  const schema: FormSchema = $derived({ types, enums });

  let field = $derived(expandNamedField(originalField, schema, seen));

  let typeAnnotation = $derived(
    describeFieldType(originalField.typeRef, schema, seen),
  );

  let arrayDims = $derived(
    field.typeRef.kind === "array" ? (field.typeRef.arrayDims ?? 1) : 0,
  );

  const childSeen = $derived(
    originalField.typeRef.kind === "type" && originalField.typeRef.typeName
      ? [...seen, originalField.typeRef.typeName]
      : seen,
  );

  let arrayItemRef = $derived.by((): TypeRef | undefined => {
    if (field.typeRef.kind !== "array") return undefined;
    if (!field.typeRef.arrayType) return undefined;
    if (arrayDims > 1) {
      return { ...field.typeRef, arrayDims: arrayDims - 1 };
    }
    return field.typeRef.arrayType;
  });
</script>

{#if field.typeRef.kind === "array" && arrayItemRef}
  <ArrayField
    {field}
    {depth}
    {railed}
    {typeAnnotation}
    itemRef={arrayItemRef}
    {types}
    {enums}
    seen={childSeen}
    {value}
    {onChange}
    {onRemove}
  />
{:else if field.typeRef.kind === "object"}
  <ObjectField
    {field}
    {depth}
    {railed}
    {typeAnnotation}
    {types}
    {enums}
    seen={childSeen}
    {value}
    {onChange}
    {onRemove}
  />
{:else if field.typeRef.kind === "map"}
  {#if field.typeRef.mapType}
    <MapField
      {field}
      {depth}
      {railed}
      {typeAnnotation}
      valueRef={field.typeRef.mapType}
      {types}
      {enums}
      seen={childSeen}
      {value}
      {onChange}
      {onRemove}
    />
  {:else}
    <p class="text-sm text-content-muted italic">
      {field.name} has an unknown map value type.
    </p>
  {/if}
{:else if field.typeRef.kind === "enum"}
  <EnumField {field} {enums} {value} {onChange} {onRemove} {typeAnnotation} />
{:else if field.typeRef.kind === "primitive"}
  <PrimitiveField {field} {value} {onChange} {onRemove} {typeAnnotation} />
{:else}
  <p class="text-sm text-content-muted italic">
    {field.name} references an unknown type.
  </p>
{/if}
