import type { IrSchema } from "@varavel/vdl-plugin-sdk";
import { createId } from "./id";

/**
 * Supported route segment kinds for top-level IR explorer nodes.
 */
export type IrNodeKind = "types" | "enums" | "constants" | "docs";

/**
 * Build the deterministic identifier and URL path for a top-level IR node.
 *
 * @param kind Node category used as the route segment.
 * @param name Human-readable node name.
 * @param obj Node payload used to derive a deterministic identifier.
 * @returns Route metadata with stable `id` and `urlPath` values.
 */
export function createIrNodeRoute(
  kind: IrNodeKind,
  name: string,
  obj: unknown,
): { id: string; urlPath: string } {
  const id = createId(name, obj);
  const urlPath = `#/${kind}/${id}`;
  return { id, urlPath };
}

/**
 * Build a dictionary that maps IR node names to their internal explorer routes.
 *
 * @remarks
 * If multiple top-level nodes share the same name across categories, the first
 * discovered category keeps precedence (`types`, then `enums`, then `constants`)
 * to keep output deterministic.
 *
 * @param ir Schema used to derive cross-reference links.
 * @returns Name-to-URL map used by the Shiki link transformer.
 */
export function createIrNodeLinkDictionary(ir: IrSchema): Map<string, string> {
  const links = new Map<string, string>();

  for (const type of ir.types) {
    if (!links.has(type.name)) {
      links.set(type.name, createIrNodeRoute("types", type.name, type).urlPath);
    }
  }

  for (const en of ir.enums) {
    if (!links.has(en.name)) {
      links.set(en.name, createIrNodeRoute("enums", en.name, en).urlPath);
    }
  }

  for (const constant of ir.constants) {
    if (!links.has(constant.name)) {
      links.set(
        constant.name,
        createIrNodeRoute("constants", constant.name, constant).urlPath,
      );
    }
  }

  return links;
}
