import type { Field, IrSchema, TypeDef } from "@varavel/vdl-plugin-sdk";
import { generateVdl } from "@varavel/vdl-plugin-sdk/utils/codegen";
import { getAnnotation } from "@varavel/vdl-plugin-sdk/utils/ir";
import {
  firstParagraph as mdFirstParagraph,
  title as mdTitle,
} from "@varavel/vdl-plugin-sdk/utils/markdown";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { highlighter } from "$lib/shiki";
import {
  createIrNodeLinkDictionary,
  createIrNodeRoute,
  createRpcOperationRoute,
  createRpcRoute,
} from "./links";
import { createIrNodeLinkTransformer } from "./shiki-links-transformer";
import type {
  RichIrSchema,
  RichIrSchemaRpcOperationKind,
  SourceCode,
} from "./types";

/**
 * Convert markdown docstrings to sanitized HTML for rendering in the UI.
 *
 * @param markdown The markdown string to convert, or undefined if no docstring is present.
 * @returns A sanitized HTML string if markdown was provided, or undefined if no docstring is present.
 */
function markdownToHtmlDoc(markdown: string | undefined): string | undefined {
  if (markdown === undefined) {
    return undefined;
  }

  const parsed = marked.parse(markdown) as string;
  return DOMPurify.sanitize(parsed);
}

/**
 * Determine if a field represents an RPC operation and return its kind ("procedure" or "stream") if so.
 *
 * @param field The field to check for RPC operation annotations.
 * @returns The RPC operation kind if the field is annotated as an RPC operation, or undefined if it is not an RPC operation.
 */
function findRpcOperationKind(
  field: Field,
): RichIrSchemaRpcOperationKind | undefined {
  if (getAnnotation(field.annotations, "proc")) {
    return "procedure";
  }

  if (getAnnotation(field.annotations, "stream")) {
    return "stream";
  }

  return undefined;
}

/**
 * Find the "input" or "output" field of an RPC operation field, if it exists and is properly structured.
 *
 * @param operationField The field representing the RPC operation, which should be an object type containing "input" and/or "output" fields.
 * @param name The name of the field to find, either "input" or "output".
 * @returns The "input" or "output" field if it exists and is properly structured, or undefined if it does not exist or is not properly structured.
 */
function findRpcInputOutputField(
  operationField: Field,
  name: "input" | "output",
): Field | undefined {
  if (operationField.typeRef.kind !== "object") {
    return undefined;
  }

  return operationField.typeRef.objectFields?.find(
    (field) => field.name === name,
  );
}

/**
 * Create a temporary type definition for a field to generate source code
 * sice the field itself can't be generated without its parent type.
 *
 * Used exclusively for `generateFieldSource` function.
 */
function createFieldPreviewType(field: Field): TypeDef {
  return {
    position: field.position,
    name: "__preview__",
    annotations: [],
    typeRef: {
      kind: "object",
      objectFields: [field],
    },
  };
}

/**
 * Remove the temporary type definition wrapper added by `createFieldPreviewType`
 * to get clean source code for a field.
 *
 * Used exclusively for `generateFieldSource` function.
 */
function unwrapPreviewFieldSource(raw: string): string {
  const lines = raw.split("\n");
  if (lines.length <= 2) {
    return raw.trim();
  }

  return lines
    .slice(1, -1)
    .map((line) => (line.startsWith("  ") ? line.slice(2) : line))
    .join("\n")
    .trim();
}

/**
 * Generate VDL source code for a field.;
 *
 * @param field The field for which to generate source code.
 * @returns A string containing the generated VDL source code for the field, with the temporary type definition wrapper removed.
 */
function generateFieldSource(field: Field): string {
  const raw = generateVdl(createFieldPreviewType(field), {
    docstrings: "strip",
  });
  return unwrapPreviewFieldSource(raw);
}

/**
 * Enrich an IR schema with stable identifiers and derived doc metadata.
 *
 * IDs are generated from slugified labels.
 *
 * Doc pages are the only entries allowed to duplicate labels, so duplicated doc
 * titles receive a numeric suffix (`-1`, `-2`, ...) in insertion order.
 *
 * @param ir Base IR schema to enrich.
 * @returns Enriched IR schema with identifiers and doc presentation fields.
 */
export async function enrichIrSchema(ir: IrSchema): Promise<RichIrSchema> {
  const linkDictionary = createIrNodeLinkDictionary(ir);
  const linkTransformer = createIrNodeLinkTransformer(linkDictionary);
  const shikiTransformers = [linkTransformer];

  /**
   * Generate syntax-highlighted source code for a given raw VDL string, using Shiki
   * with a custom transformer to linkify IR node references.
   * @param raw
   * @returns
   */
  const toSourceCode = async (raw: string): Promise<SourceCode> => {
    const htmlLightPromise = highlighter.highlight(
      raw,
      "vdl",
      "light",
      shikiTransformers,
    );
    const htmlDarkPromise = highlighter.highlight(
      raw,
      "vdl",
      "dark",
      shikiTransformers,
    );

    const [htmlLight, htmlDark] = await Promise.all([
      htmlLightPromise,
      htmlDarkPromise,
    ]);

    return { raw, htmlLight, htmlDark };
  };

  const types: RichIrSchema["types"] = await Promise.all(
    ir.types.map(async (type) => {
      const { id, urlPath } = createIrNodeRoute("types", type.name);

      const raw = generateVdl(type, { docstrings: "strip-top-level" });
      const sourceCode = await toSourceCode(raw);
      const htmlDoc = markdownToHtmlDoc(type.doc);

      const sourceIr = { ...type };
      return { ...type, id, urlPath, htmlDoc, sourceCode, sourceIr };
    }),
  );

  const rpcs: RichIrSchema["rpcs"] = (
    await Promise.all(
      types
        // Filter out types that are not annotated as RPCs
        .filter((type) => getAnnotation(type.annotations, "rpc"))
        // Transform RPC types into rich RPC schema entries
        .map(async (type) => {
          const rpcName = type.name;
          const { id: rpcId, urlPath: rpcUrlPath } = createRpcRoute(rpcName);

          // Extract all child fields of object kind
          const objectFields =
            type.typeRef.kind === "object"
              ? (type.typeRef.objectFields ?? [])
              : [];

          // Enrich each RPC operation in the RPC type's fields
          const operations = (
            await Promise.all(
              objectFields.map(
                async (
                  field,
                ): Promise<
                  RichIrSchema["rpcs"][number]["operations"][number] | undefined
                > => {
                  const kind = findRpcOperationKind(field);
                  if (!kind) return undefined;

                  const { id: operationId, urlPath: operationUrlPath } =
                    createRpcOperationRoute(rpcName, field.name);

                  const inputField = findRpcInputOutputField(field, "input");
                  const outputField = findRpcInputOutputField(field, "output");

                  const inputSourceCode = inputField
                    ? await toSourceCode(generateFieldSource(inputField))
                    : undefined;
                  const outputSourceCode = outputField
                    ? await toSourceCode(generateFieldSource(outputField))
                    : undefined;

                  const sourceIr = { ...field };
                  return {
                    ...field,
                    id: operationId,
                    urlPath: operationUrlPath,
                    rpcId,
                    rpcUrlPath,
                    rpcName,
                    kind,
                    htmlDoc: markdownToHtmlDoc(field.doc),
                    inputSourceCode,
                    outputSourceCode,
                    sourceIr,
                  };
                },
              ),
            )
          )
            // Filter out undefined results from operations that were not
            // properly structured as RPC operations
            .filter(
              (operation): operation is NonNullable<typeof operation> =>
                operation !== undefined,
            );

          return {
            id: rpcId,
            name: rpcName,
            urlPath: rpcUrlPath,
            htmlDoc: type.htmlDoc,
            sourceCode: type.sourceCode,
            sourceIr: type.sourceIr,
            operations,
          };
        }),
    )
  )
    // Filter out RPCs that have no valid operations after enrichment, as
    // they won't have meaningful pages in the explorer
    .filter((rpc) => rpc.operations.length > 0);

  const enums: RichIrSchema["enums"] = await Promise.all(
    ir.enums.map(async (en) => {
      const { id, urlPath } = createIrNodeRoute("enums", en.name);

      const raw = generateVdl(en, { docstrings: "strip-top-level" });
      const sourceCode = await toSourceCode(raw);
      const htmlDoc = markdownToHtmlDoc(en.doc);

      const sourceIr = { ...en };
      return { ...en, id, urlPath, htmlDoc, sourceCode, sourceIr };
    }),
  );

  const constants: RichIrSchema["constants"] = await Promise.all(
    ir.constants.map(async (constant) => {
      const { id, urlPath } = createIrNodeRoute("constants", constant.name);

      const raw = generateVdl(constant, { docstrings: "strip-top-level" });
      const sourceCode = await toSourceCode(raw);
      const htmlDoc = markdownToHtmlDoc(constant.doc);

      const sourceIr = { ...constant };
      return { ...constant, id, urlPath, htmlDoc, sourceCode, sourceIr };
    }),
  );

  // Count the occurrences of each doc title to determine which ones
  // need duplicate suffixes
  const docTitleCounts = new Map<string, number>();
  for (const doc of ir.docs) {
    const title = mdTitle(doc.content);
    const baseId = createIrNodeRoute("docs", title).id;
    docTitleCounts.set(baseId, (docTitleCounts.get(baseId) ?? 0) + 1);
  }

  const seenDocTitleCounts = new Map<string, number>();
  const docs: RichIrSchema["docs"] = ir.docs.map((doc) => {
    const title = mdTitle(doc.content);
    const firstParagraph = mdFirstParagraph(doc.content) ?? "";
    const baseId = createIrNodeRoute("docs", title).id;

    const seenCount = (seenDocTitleCounts.get(baseId) ?? 0) + 1;
    seenDocTitleCounts.set(baseId, seenCount);

    const duplicateIndex =
      (docTitleCounts.get(baseId) ?? 0) > 1 ? seenCount : undefined;

    const { id, urlPath } = createIrNodeRoute("docs", title, {
      duplicateIndex,
    });

    const raw = doc.content;
    const htmlLight = markdownToHtmlDoc(raw) ?? "";
    const htmlDark = htmlLight;
    const sourceCode = { raw, htmlLight, htmlDark };

    const sourceIr = { ...doc };
    return {
      ...doc,
      id,
      urlPath,
      title,
      firstParagraph,
      sourceCode,
      sourceIr,
    };
  });

  return {
    entryPoint: ir.entryPoint,
    rpcs,
    types,
    enums,
    constants,
    docs,
  };
}
