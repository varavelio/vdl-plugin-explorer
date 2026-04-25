import type { IrSchema } from "@varavel/vdl-plugin-sdk";
import { createId } from "./id";

/**
 * Supported route segment kinds for top-level IR explorer nodes.
 */
export type IrNodeKind = "types" | "enums" | "constants" | "docs";

/**
 * Options for generating IR node routes, used to handle duplicate
 * names across categories by appending a numeric suffix to the route ID.
 */
type IrNodeRouteOptions = {
  duplicateIndex?: number;
};

/**
 * Build the deterministic identifier and URL path for a top-level IR node.
 *
 * @param kind Node category used as the route segment.
 * @param name Human-readable node name.
 * @param options Route options used for special-case ID generation.
 * @returns Route metadata with stable `id` and `urlPath` values.
 */
export function createIrNodeRoute(
  kind: IrNodeKind,
  name: string,
  options: IrNodeRouteOptions = {},
): { id: string; urlPath: string } {
  let id = createId(name);
  if (options.duplicateIndex !== undefined) {
    id = `${id}-${options.duplicateIndex}`;
  }
  const urlPath = `#/${kind}/${id}`;
  return { id, urlPath };
}

/**
 * Build route metadata for an RPC service page.
 *
 * @param name RPC service name.
 * @returns Stable RPC id and docs page URL.
 */
export function createRpcRoute(name: string): { id: string; urlPath: string } {
  const id = createId(name);
  const urlPath = `#/rpcs/${id}`;
  return { id, urlPath };
}

/**
 * Build route metadata for an RPC operation page.
 *
 * @param rpcName RPC service name.
 * @param operationName Operation name.
 * @returns Stable id, readable route segment, parent route segment, and URL.
 */
export function createRpcOperationRoute(
  rpcName: string,
  operationName: string,
): { id: string; urlPath: string } {
  const id = createId(operationName);
  const rpcId = createId(rpcName);
  const urlPath = `#/rpcs/${rpcId}/${id}`;
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
      links.set(type.name, createIrNodeRoute("types", type.name).urlPath);
    }
  }

  for (const en of ir.enums) {
    if (!links.has(en.name)) {
      links.set(en.name, createIrNodeRoute("enums", en.name).urlPath);
    }
  }

  for (const constant of ir.constants) {
    if (!links.has(constant.name)) {
      links.set(
        constant.name,
        createIrNodeRoute("constants", constant.name).urlPath,
      );
    }
  }

  return links;
}
