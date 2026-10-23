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
  createHttpRpcProcRoute,
  createHttpRpcRoute,
  createIrNodeLinkDictionary,
  createIrNodeRoute,
} from "./links";
import { createIrNodeLinkTransformer } from "./shiki-links-transformer";
import type { RichIrSchema, SourceCode } from "./types";

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
 * Determine if a field represents an HTTP RPC procedure.
 *
 * @param field The field to check for the procedure annotation.
 * @returns True when the field carries `@proc`, otherwise false.
 */
function isHttpRpcProc(field: Field): boolean {
  return getAnnotation(field.annotations, "proc") !== undefined;
}

/**
 * Generate valid VDL source for a procedure by synthesizing its parent RPC
 * type with only this proc inside. Bare `input {}`/`output {}` blocks are
 * not valid VDL, so they break highlighting and reference links; the full
 * wrapper keeps every snippet parseable with no sibling bloat.
 *
 * @param rpc The parent RPC type carrying the name and annotations.
 * @param proc The procedure field carrying its own annotations.
 * @returns Canonical VDL source for the single-proc RPC.
 */
function generateProcSource(rpc: TypeDef, proc: Field): string {
  const ioFields = (
    proc.typeRef.kind === "object" ? (proc.typeRef.objectFields ?? []) : []
  ).filter((field) => field.name === "input" || field.name === "output");
  const preview: TypeDef = {
    position: rpc.position,
    name: rpc.name,
    annotations: rpc.annotations,
    typeRef: {
      kind: "object",
      objectFields: [
        { ...proc, typeRef: { kind: "object", objectFields: ioFields } },
      ],
    },
  };
  return generateVdl(preview, { docstrings: "strip-top-level" });
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

  const httpRpcs: RichIrSchema["httpRpcs"] = (
    await Promise.all(
      types
        // Filter out types that are not annotated as HTTP HTTP RPC services
        .filter((type) => getAnnotation(type.annotations, "httpRpc"))
        // Transform HTTP RPC types into rich HTTP RPC schema entries
        .map(async (type) => {
          const httpRpcName = type.name;
          const { id: httpRpcId, urlPath: httpRpcUrlPath } =
            createHttpRpcRoute(httpRpcName);

          // Extract all child fields of object kind
          const objectFields =
            type.typeRef.kind === "object"
              ? (type.typeRef.objectFields ?? [])
              : [];

          // Enrich each HTTP RPC procedure in the RPC type's fields
          const procs = (
            await Promise.all(
              objectFields.map(
                async (
                  field,
                ): Promise<
                  RichIrSchema["httpRpcs"][number]["procs"][number] | undefined
                > => {
                  if (!isHttpRpcProc(field)) return undefined;

                  const { id: procId, urlPath: procUrlPath } =
                    createHttpRpcProcRoute(httpRpcName, field.name);

                  const sourceCode = await toSourceCode(
                    generateProcSource(type, field),
                  );

                  const sourceIr = { ...field };
                  return {
                    ...field,
                    id: procId,
                    urlPath: procUrlPath,
                    httpRpcId,
                    httpRpcUrlPath,
                    httpRpcName,
                    htmlDoc: markdownToHtmlDoc(field.doc),
                    sourceCode,
                    sourceIr,
                  };
                },
              ),
            )
          )
            // Filter out undefined results from fields that were not
            // properly structured as HTTP RPC procedures
            .filter(
              (proc): proc is NonNullable<typeof proc> => proc !== undefined,
            );

          return {
            id: httpRpcId,
            name: httpRpcName,
            urlPath: httpRpcUrlPath,
            htmlDoc: type.htmlDoc,
            sourceCode: type.sourceCode,
            sourceIr: type.sourceIr,
            procs,
          };
        }),
    )
  )
    // Filter out HTTP RPCs that have no valid procedures after enrichment, as
    // they won't have meaningful pages in the explorer
    .filter((httpRpc) => httpRpc.procs.length > 0);

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

  const sourceReferences: RichIrSchema["sourceReferences"] = [
    ...types.map((type) => ({
      kind: "type" as const,
      href: type.urlPath,
      title: type.name,
      sourceCode: type.sourceCode,
    })),
    ...enums.map((en) => ({
      kind: "enum" as const,
      href: en.urlPath,
      title: en.name,
      sourceCode: en.sourceCode,
    })),
    ...constants.map((constant) => ({
      kind: "constant" as const,
      href: constant.urlPath,
      title: constant.name,
      sourceCode: constant.sourceCode,
    })),
  ];

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
    httpRpcs,
    types,
    enums,
    constants,
    docs,
    sourceReferences,
  };
}
