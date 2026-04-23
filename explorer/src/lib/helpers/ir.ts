import type { LiteralValue, TypeRef } from "@varavel/vdl-plugin-sdk";
import { unwrapLiteral } from "@varavel/vdl-plugin-sdk/utils/ir";
import { firstNChars, pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";

const INLINE_TEXT_LIMIT = 48;

/**
 * Produces a compact inline label for a type reference.
 *
 * @param typeRef Type reference to summarize.
 * @returns Compact textual representation.
 */
export function typeRefToInlineLabel(typeRef: TypeRef | undefined): string {
  if (!typeRef) return "unknown";

  switch (typeRef.kind) {
    case "primitive":
      return typeRef.primitiveName ?? "primitive";
    case "type":
      return typeRef.typeName ?? "type";
    case "enum":
      return typeRef.enumName ?? "enum";
    case "array": {
      const dims = typeRef.arrayDims ?? 1;
      return `${typeRefToInlineLabel(typeRef.arrayType)}${"[]".repeat(dims)}`;
    }
    case "map":
      return `map<string, ${typeRefToInlineLabel(typeRef.mapType)}>`;
    case "object":
      return "object";
    default:
      return "unknown";
  }
}

/**
 * Produces a compact inline label for a literal value.
 *
 * @param value Literal value to summarize.
 * @returns Compact textual representation.
 */
export function literalToInlineLabel(value: LiteralValue | undefined): string {
  if (!value) return "unknown";

  const literal = unwrapLiteral(value);

  if (typeof literal === "string") {
    return JSON.stringify(firstNChars(literal, INLINE_TEXT_LIMIT, false));
  }

  if (typeof literal === "number" || typeof literal === "boolean") {
    return String(literal);
  }

  if (literal == null) {
    return "null";
  }

  if (Array.isArray(literal)) {
    return `Array (${pluralize("item", literal.length)})`;
  }

  return `Object (${pluralize("entry", Object.keys(literal).length)})`;
}
