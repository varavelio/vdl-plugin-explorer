import type { EnumDef, Field, TypeDef, TypeRef } from "@varavel/vdl-plugin-sdk";
import { unwrapLiteral } from "@varavel/vdl-plugin-sdk/utils/ir";

/**
 * Named schema entries available to form fields.
 *
 * Passed down from the explorer store so the builder stays reusable and
 * decoupled from global state.
 */
export type FormSchema = {
  types: TypeDef[];
  enums: EnumDef[];
};

/**
 * Find a named type definition by name.
 *
 * @param types All type definitions in the schema.
 * @param name Type name to look up.
 * @returns The matching definition, or undefined when unknown.
 */
export function findType(types: TypeDef[], name: string): TypeDef | undefined {
  return types.find((type) => type.name === name);
}

/**
 * Find a named enum definition by name.
 *
 * @param enums All enum definitions in the schema.
 * @param name Enum name to look up.
 * @returns The matching definition, or undefined when unknown.
 */
export function findEnum(enums: EnumDef[], name: string): EnumDef | undefined {
  return enums.find((enm) => enm.name === name);
}

/**
 * Select option derived from an enum member.
 */
export type EnumOption = {
  value: string;
  label: string;
};

/**
 * Build select options for an enum definition.
 *
 * @param enm Enum definition with resolved member values.
 * @returns One option per member, with the raw value as string.
 */
export function enumOptions(enm: EnumDef): EnumOption[] {
  return enm.members.map((member) => ({
    value: String(unwrapLiteral<unknown>(member.value)),
    label: member.name,
  }));
}

/**
 * Expand a field whose reference points at a named type.
 *
 * Follows alias chains until a non-`type` reference is reached. Stops when
 * the target is unknown or recursive, in which case the original field is
 * returned unchanged and the caller renders a fallback.
 *
 * @param field Field to expand.
 * @param schema Named schema entries used for resolution.
 * @param seen Type names already expanded above this field.
 * @returns The field with an inline reference when resolvable.
 */
export function expandNamedField(
  field: Field,
  schema: FormSchema,
  seen: string[],
): Field {
  let ref = field.typeRef;
  const visited = [...seen];

  while (ref.kind === "type" && ref.typeName) {
    if (visited.includes(ref.typeName)) return field;
    const target = findType(schema.types, ref.typeName);
    if (!target) return field;
    visited.push(ref.typeName);
    ref = target.typeRef;
  }

  if (ref === field.typeRef) return field;
  return { ...field, typeRef: ref };
}

/**
 * Compute the blank value used when adding an array item or map entry.
 *
 * Objects and maps start empty so nested fields can fill them in.
 * Primitives start at their zero value, enums at their first member.
 *
 * @param ref Reference describing the new value.
 * @param schema Named schema entries used for resolution.
 * @param seen Type names already expanded above this field.
 * @returns A fresh blank value for the reference.
 */
export function defaultValueForType(
  ref: TypeRef,
  schema: FormSchema,
  seen: string[],
): unknown {
  if (ref.kind === "array" || ref.kind === "object" || ref.kind === "map") {
    return ref.kind === "array" ? [] : {};
  }

  if (ref.kind === "enum" && ref.enumName) {
    const enm = findEnum(schema.enums, ref.enumName);
    if (!enm || enm.members.length === 0) return "";
    return String(unwrapLiteral<unknown>(enm.members[0].value));
  }

  if (ref.kind === "type" && ref.typeName) {
    if (seen.includes(ref.typeName)) return {};
    const target = findType(schema.types, ref.typeName);
    if (!target) return {};
    return defaultValueForType(target.typeRef, schema, [...seen, ref.typeName]);
  }

  switch (ref.primitiveName) {
    case "int":
    case "float":
      return 0;
    case "bool":
      return false;
    case "datetime":
      return new Date().toISOString();
    default:
      return "";
  }
}
