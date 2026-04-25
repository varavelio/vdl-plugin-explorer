import type { Field, IrSchema } from "@varavel/vdl-plugin-sdk";

/**
 * An empty IR schema.
 */
export const EMPTY_IR: IrSchema = {
  entryPoint: "",
  types: [],
  enums: [],
  constants: [],
  docs: [],
};

/**
 * An enriched empty IR schema.
 */
export const EMPTY_RICH_IR: RichIrSchema = {
  entryPoint: "",
  rpcs: [],
  types: [],
  enums: [],
  constants: [],
  docs: [],
};

/** Contains the raw code and highlighted light and dark HTML representation of a source code */
export type RichIrSchemaSourceCode = {
  raw: string;
  htmlLight: string;
  htmlDark: string;
};

/**
 * Enriched IR type entry.
 *
 * Adds stable identifier and router path metadata to the base schema item.
 */
export type RichIrSchemaType = IrSchema["types"][number] & {
  id: string;
  urlPath: string;
  /** The top-level type doc converted from markdown to HTML. */
  htmlDoc?: string;
  /** The canonical source code for this type without the type docstring. */
  sourceCode: RichIrSchemaSourceCode;
  /** The original IR node */
  sourceIr: IrSchema["types"][number];
};

/**
 * Supported RPC operation kinds exposed by the explorer.
 */
export type RichIrSchemaRpcOperationKind = "procedure" | "stream";

/**
 * Enriched RPC operation entry derived from a field inside an `@rpc` type.
 */
export type RichIrSchemaRpcOperation = Field & {
  id: string;
  routeId: string;
  urlPath: string;
  rpcId: string;
  rpcRouteId: string;
  rpcUrlPath: string;
  rpcName: string;
  kind: RichIrSchemaRpcOperationKind;
  /** The operation field doc converted from markdown to HTML. */
  htmlDoc?: string;
  /** Highlighted VDL snippet for the operation input when present. */
  inputSourceCode?: RichIrSchemaSourceCode;
  /** Highlighted VDL snippet for the operation output when present. */
  outputSourceCode?: RichIrSchemaSourceCode;
  /** The original IR node */
  sourceIr: Field;
};

/**
 * Enriched RPC service entry derived from a type annotated with `@rpc`.
 */
export type RichIrSchemaRpc = {
  id: string;
  routeId: string;
  name: string;
  urlPath: string;
  /** The top-level RPC doc converted from markdown to HTML. */
  htmlDoc?: string;
  /** The canonical source code for this RPC without the top-level docstring. */
  sourceCode: RichIrSchemaSourceCode;
  /** The original IR node */
  sourceIr: IrSchema["types"][number];
  operations: RichIrSchemaRpcOperation[];
};

/**
 * Enriched IR enum entry.
 *
 * Adds stable identifier and router path metadata to the base schema item.
 */
export type RichIrSchemaEnum = IrSchema["enums"][number] & {
  id: string;
  urlPath: string;
  /** The top-level enum doc converted from markdown to HTML. */
  htmlDoc?: string;
  /** The canonical source code for this enum without the enum docstring. */
  sourceCode: RichIrSchemaSourceCode;
  /** The original IR node */
  sourceIr: IrSchema["enums"][number];
};

/**
 * Enriched IR constant entry.
 *
 * Adds stable identifier and router path metadata to the base schema item.
 */
export type RichIrSchemaConstant = IrSchema["constants"][number] & {
  id: string;
  urlPath: string;
  /** The top-level constant doc converted from markdown to HTML. */
  htmlDoc?: string;
  /** The canonical source code for this constant without the constant docstring. */
  sourceCode: RichIrSchemaSourceCode;
  /** The original IR node */
  sourceIr: IrSchema["constants"][number];
};

/**
 * Enriched IR doc entry.
 *
 * Adds stable identifier, router path, and derived presentation metadata to the
 * base schema item.
 */
export type RichIrSchemaDoc = IrSchema["docs"][number] & {
  id: string;
  urlPath: string;
  title: string;
  firstParagraph: string;
  /** The original markdown and HTML of the doc */
  sourceCode: RichIrSchemaSourceCode;
  /** The original IR node */
  sourceIr: IrSchema["docs"][number];
};

/**
 * IR schema enriched with stable identifiers and derived documentation metadata.
 *
 * Each type, enum, constant, and doc receives an `id` and `urlPath` fields. Docs also
 * include a parsed `title` and `firstParagraph` for easier rendering and lookup.
 */
export type RichIrSchema = {
  entryPoint: string;
  rpcs: RichIrSchemaRpc[];
  types: RichIrSchemaType[];
  enums: RichIrSchemaEnum[];
  constants: RichIrSchemaConstant[];
  docs: RichIrSchemaDoc[];
};

/**
 * Union type representing any node in the enriched IR schema.
 *
 * This type is useful for components or functions that handle multiple IR entity
 * types regardless of their specific category (type, enum, constant, or doc).
 */
export type RichIrSchemaNode =
  | RichIrSchemaType
  | RichIrSchemaEnum
  | RichIrSchemaConstant
  | RichIrSchemaDoc;
