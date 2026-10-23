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
 * Spell a reference the way it reads in VDL source.
 *
 * @param ref Reference to spell.
 * @returns Source spelling such as `string`, `Size`, `int[][]` or `unknown`.
 */
function spellType(ref: TypeRef): string {
  switch (ref.kind) {
    case "primitive":
      return ref.primitiveName ?? "unknown";
    case "type":
      return ref.typeName ?? "unknown";
    case "enum":
      return ref.enumName ?? "unknown";
    case "object":
      return "object";
    case "array": {
      const inner = ref.arrayType ? spellType(ref.arrayType) : "unknown";
      return `${inner}${"[]".repeat(ref.arrayDims ?? 1)}`;
    }
    case "map":
      return `map[${ref.mapType ? spellType(ref.mapType) : "unknown"}]`;
    default:
      return "unknown";
  }
}

/**
 * Describe a field type for display next to its name, using the declared
 * VDL spelling. Named references add their resolved shape in parentheses
 * because the name alone hides whether it is an object, array, map or
 * alias (for example `Scores (int[])`).
 *
 * @param ref Declared (pre-expansion) field reference.
 * @param schema Named schema entries used to resolve aliases.
 * @param seen Type names already expanded above this field.
 * @returns Display spelling, or null when the reference is unknown.
 */
export function describeFieldType(
  ref: TypeRef,
  schema: FormSchema,
  seen: string[],
): string | null {
  switch (ref.kind) {
    case "primitive":
      return ref.primitiveName ?? null;
    case "enum":
      return ref.enumName ?? null;
    case "array":
    case "map":
    case "object":
      return spellType(ref);
    case "type": {
      if (!ref.typeName) return null;
      let resolved = ref;
      const visited = [...seen];
      while (resolved.kind === "type" && resolved.typeName) {
        if (visited.includes(resolved.typeName)) return ref.typeName;
        const target = findType(schema.types, resolved.typeName);
        if (!target) return ref.typeName;
        visited.push(resolved.typeName);
        resolved = target.typeRef;
      }
      if (resolved === ref) return ref.typeName;
      return `${ref.typeName} (${spellType(resolved)})`;
    }
    default:
      return null;
  }
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
