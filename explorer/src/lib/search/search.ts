import type {
  ConstantDef,
  EnumDef,
  EnumMember,
  Field,
  LiteralValue,
  TypeDef,
  TypeRef,
} from "@varavel/vdl-plugin-sdk";
import { unwrapLiteral } from "@varavel/vdl-plugin-sdk/utils/ir";
import { firstParagraph as mdFirstParagraph } from "@varavel/vdl-plugin-sdk/utils/markdown";
import { firstNChars } from "@varavel/vdl-plugin-sdk/utils/strings";
import MiniSearch from "minisearch";
import { store } from "$lib/store";

/** Maximum number of hits returned for a single query. */
const MAX_RESULTS = 12;

/** Character limit used when generating short summaries for indexed documents. */
const SUMMARY_LIMIT = 180;

/**
 * Resource kinds exposed by the explorer search index.
 */
export type SearchResultKind = "doc" | "type" | "enum" | "constant";

/**
 * Search hit shape consumed by the command palette UI.
 */
export type SearchResult = {
  id: string;
  kind: SearchResultKind;
  urlPath: string;
  name?: string;
  title?: string;
  summary: string;
  score: number;
  terms: string[];
  queryTerms: string[];
};

type SearchDocument = {
  id: string;
  kind: SearchResultKind;
  urlPath: string;
  name?: string;
  title?: string;
  summary: string;
  body: string;
};

/**
 * Collapses repeated whitespace and trims leading/trailing spaces.
 *
 * @param text - Raw text that may contain line breaks or extra spaces.
 * @returns Normalized text, or an empty string when the input is missing.
 */
function compactText(text: string | undefined): string {
  return text?.replace(/\s+/g, " ").trim() ?? "";
}

/**
 * Combines text fragments into a normalized multiline block for indexing.
 *
 * Empty fragments are removed after normalization.
 *
 * @param parts - Candidate text fragments.
 * @returns A newline-separated string with only meaningful content.
 */
function joinSearchParts(parts: Array<string | undefined>): string {
  return parts.map(compactText).filter(Boolean).join("\n");
}

/**
 * Builds a compact summary suitable for search previews.
 *
 * The function prefers the first markdown paragraph and enforces a fixed
 * character limit.
 *
 * @param text - Source markdown or plain text.
 * @returns A short summary string, or an empty string when no text is available.
 */
function summarizeText(text: string | undefined): string {
  const normalized = compactText(text);
  if (!normalized) return "";

  const paragraph = compactText(mdFirstParagraph(normalized) ?? normalized);
  return firstNChars(paragraph, SUMMARY_LIMIT, false);
}

/**
 * Converts an IR literal value to plain text for full-text indexing.
 *
 * @param value - Literal value from the VDL IR.
 * @returns String representation of the literal.
 */
function literalToSearchText(value: LiteralValue): string {
  const literal = unwrapLiteral(value);

  if (literal == null) return "null";
  if (typeof literal === "string") return literal;
  if (typeof literal === "number" || typeof literal === "boolean") {
    return String(literal);
  }

  return JSON.stringify(literal);
}

/**
 * Produces searchable text for an object field definition.
 *
 * @param field - Field metadata from a VDL object type.
 * @returns Normalized text containing name, docs, required/optional state, and type details.
 */
function fieldToSearchText(field: Field): string {
  return joinSearchParts([
    field.name,
    field.doc,
    field.optional ? "optional" : "required",
    typeRefToSearchText(field.typeRef),
  ]);
}

/**
 * Produces searchable text for a type reference tree.
 *
 * @param typeRef - Type reference from the VDL IR.
 * @returns Flattened textual description of the type reference.
 */
function typeRefToSearchText(typeRef: TypeRef | undefined): string {
  if (!typeRef) return "";

  switch (typeRef.kind) {
    case "primitive":
      return typeRef.primitiveName ?? "primitive";
    case "type":
      return typeRef.typeName ?? "type";
    case "enum":
      return joinSearchParts([typeRef.enumName, typeRef.enumType]);
    case "array":
      return joinSearchParts([
        "array",
        typeRef.arrayDims ? `${typeRef.arrayDims} dimensions` : undefined,
        typeRefToSearchText(typeRef.arrayType),
      ]);
    case "map":
      return joinSearchParts(["map", typeRefToSearchText(typeRef.mapType)]);
    case "object":
      return joinSearchParts([
        "object",
        ...(typeRef.objectFields ?? []).map(fieldToSearchText),
      ]);
    default:
      return "";
  }
}

/**
 * Produces searchable text for a single enum member.
 *
 * @param member - Enum member definition.
 * @returns Normalized text with name, docs, and literal value.
 */
function enumMemberToSearchText(member: EnumMember): string {
  return joinSearchParts([
    member.name,
    member.doc,
    literalToSearchText(member.value),
  ]);
}

/**
 * Creates the complete list of indexable search documents from the current IR snapshot.
 *
 * @returns Search documents for docs, types, enums, and constants.
 */
function createSearchDocuments(): SearchDocument[] {
  const docs = store.ir.docs.map((doc) => ({
    id: doc.id,
    kind: "doc" as const,
    urlPath: doc.urlPath,
    title: doc.title,
    summary: summarizeText(doc.firstParagraph || doc.content),
    body: joinSearchParts([doc.title, doc.firstParagraph, doc.content]),
  }));

  const types = store.ir.types.map((typeDef) => createTypeDocument(typeDef));
  const enums = store.ir.enums.map((enumDef) => createEnumDocument(enumDef));
  const constants = store.ir.constants.map((constantDef) =>
    createConstantDocument(constantDef),
  );

  return [...docs, ...types, ...enums, ...constants];
}

/**
 * Creates a search document for a type definition.
 *
 * @param typeDef - Type definition enriched with routing metadata.
 * @returns Search document representing the type.
 */
function createTypeDocument(
  typeDef: TypeDef & { id: string; urlPath: string },
): SearchDocument {
  return {
    id: typeDef.id,
    kind: "type",
    urlPath: typeDef.urlPath,
    name: typeDef.name,
    summary: summarizeText(typeDef.doc),
    body: joinSearchParts([
      typeDef.name,
      typeDef.doc,
      typeRefToSearchText(typeDef.typeRef),
    ]),
  };
}

/**
 * Creates a search document for an enum definition.
 *
 * @param enumDef - Enum definition enriched with routing metadata.
 * @returns Search document representing the enum.
 */
function createEnumDocument(
  enumDef: EnumDef & { id: string; urlPath: string },
): SearchDocument {
  return {
    id: enumDef.id,
    kind: "enum",
    urlPath: enumDef.urlPath,
    name: enumDef.name,
    summary: summarizeText(enumDef.doc),
    body: joinSearchParts([
      enumDef.name,
      enumDef.doc,
      enumDef.enumType,
      ...enumDef.members.map(enumMemberToSearchText),
    ]),
  };
}

/**
 * Creates a search document for a constant definition.
 *
 * @param constantDef - Constant definition enriched with routing metadata.
 * @returns Search document representing the constant.
 */
function createConstantDocument(
  constantDef: ConstantDef & { id: string; urlPath: string },
): SearchDocument {
  return {
    id: constantDef.id,
    kind: "constant",
    urlPath: constantDef.urlPath,
    name: constantDef.name,
    summary: summarizeText(constantDef.doc),
    body: joinSearchParts([
      constantDef.name,
      constantDef.doc,
      literalToSearchText(constantDef.value),
    ]),
  };
}

/**
 * In-memory search engine for explorer resources.
 *
 * The index is built lazily on the first non-empty query and then reused by the
 * same engine instance for subsequent searches.
 */
export class SearchEngine {
  private engine: MiniSearch<SearchDocument> | null = null;

  /**
   * Lazily initializes and populates the MiniSearch instance.
   */
  private initEngine() {
    if (this.engine) return;

    this.engine = new MiniSearch<SearchDocument>({
      fields: ["name", "title", "summary", "body"],
      storeFields: ["id", "kind", "urlPath", "name", "title", "summary"],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: {
          name: 4,
          title: 4,
          summary: 2,
        },
      },
    });

    this.engine.addAll(createSearchDocuments());
  }

  /**
   * Searches explorer resources using a fuzzy, prefix-enabled query.
   *
   * @param text - Raw query text entered by the user.
   * @returns Ranked results limited to the top matches. Returns an empty array for blank queries.
   */
  search(text: string): SearchResult[] {
    const query = text.trim();
    if (!query) {
      return [];
    }

    this.initEngine();
    if (!this.engine) return [];

    return this.engine
      .search(query)
      .slice(0, MAX_RESULTS)
      .map((hit) => ({
        id: String(hit.id),
        kind: hit.kind as SearchResultKind,
        urlPath: String(hit.urlPath),
        name: hit.name ? String(hit.name) : undefined,
        title: hit.title ? String(hit.title) : undefined,
        summary: hit.summary ? String(hit.summary) : "",
        score: hit.score,
        terms: [...hit.terms],
        queryTerms: [...hit.queryTerms],
      }));
  }
}

/**
 * Shared search engine instance used across all explorer search components.
 */
export const searcher = new SearchEngine();
