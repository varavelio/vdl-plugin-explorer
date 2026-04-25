import { enrichIrSchema } from "./enricher";
import { loadRawIrSchema } from "./raw-loader";
import type { RichIrSchema } from "./types";

export {
  EMPTY_IR,
  EMPTY_RICH_IR,
  type RichIrSchema,
  type RichIrSchemaConstant,
  type RichIrSchemaDoc,
  type RichIrSchemaEnum,
  type RichIrSchemaNode,
  type RichIrSchemaRpc,
  type RichIrSchemaRpcOperation,
  type RichIrSchemaRpcOperationKind,
  type RichIrSchemaSourceCode,
  type RichIrSchemaType,
} from "./types";

/**
 * Load and normalize the IR schema for explorer store consumers.
 *
 * @remarks
 * - Runtime-injected schema (`window.__vdl_ir`) takes precedence when present.
 * - If no runtime payload is available and `dev` is enabled, `ir.local.json` is used.
 * - Otherwise, the loader falls back to {@link EMPTY_IR}.
 * - The resulting schema is always enriched through {@link enrichIrSchema}.
 *
 * @returns A rich IR schema containing stable `id` fields and parsed doc metadata.
 */
export async function loadIrSchema(): Promise<RichIrSchema> {
  return await enrichIrSchema(loadRawIrSchema());
}
