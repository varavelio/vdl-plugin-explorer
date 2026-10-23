import type { Field, IrSchema } from "@varavel/vdl-plugin-sdk";

/**
 * Contains the raw code and highlighted light and dark HTML representation
 * of a piece of source code
 */
export type SourceCode = {
  raw: string;
  htmlLight: string;
  htmlDark: string;
};

/**
 * Linkable source snippet exposed by internal source-code references.
 */
export type SourceCodeReference = {
  kind: "type" | "enum" | "constant";
  href: string;
  title: string;
  sourceCode: SourceCode;
};

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
  httpRpcs: [],
  types: [],
  enums: [],
  constants: [],
  docs: [],
  sourceReferences: [],
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
  sourceCode: SourceCode;
  /** The original IR node */
  sourceIr: IrSchema["types"][number];
};

/**
 * Enriched HTTP RPC procedure entry derived from a `@proc` field inside an `@httpRpc` type.
 */
export type RichIrSchemaHttpRpcProc = Field & {
  id: string;
  urlPath: string;
  httpRpcId: string;
  httpRpcUrlPath: string;
  httpRpcName: string;
  /** The procedure field doc converted from markdown to HTML. */
  htmlDoc?: string;
  /** Valid VDL snippet for the procedure wrapped in its parent RPC. */
  sourceCode: SourceCode;
  /** The original IR node */
  sourceIr: Field;
};

/**
 * Enriched HTTP RPC service entry derived from a type annotated with `@httpRpc`.
 */
export type RichIrSchemaHttpRpc = {
  id: string;
  name: string;
  urlPath: string;
  /** The top-level HTTP RPC doc converted from markdown to HTML. */
  htmlDoc?: string;
  /** The canonical source code for this HTTP RPC without the top-level docstring. */
  sourceCode: SourceCode;
  /** The original IR node */
  sourceIr: IrSchema["types"][number];
  procs: RichIrSchemaHttpRpcProc[];
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
  sourceCode: SourceCode;
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
  sourceCode: SourceCode;
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
  sourceCode: SourceCode;
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
  httpRpcs: RichIrSchemaHttpRpc[];
  types: RichIrSchemaType[];
  enums: RichIrSchemaEnum[];
  constants: RichIrSchemaConstant[];
  docs: RichIrSchemaDoc[];
  sourceReferences: SourceCodeReference[];
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
