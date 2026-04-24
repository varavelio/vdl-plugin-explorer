import type { IrSchema } from "@varavel/vdl-plugin-sdk";
import { generateVdl } from "@varavel/vdl-plugin-sdk/utils/codegen";
import { fingerprint as createFingerprint } from "@varavel/vdl-plugin-sdk/utils/crypto";
import {
  firstParagraph as mdFirstParagraph,
  title as mdTitle,
} from "@varavel/vdl-plugin-sdk/utils/markdown";
import { isEmptyObject } from "@varavel/vdl-plugin-sdk/utils/predicates";
import { slugify } from "@varavel/vdl-plugin-sdk/utils/strings";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { browser, dev } from "$app/environment";
import {
  highlighter,
  type ShikiHtmlNode,
  type ShikiHtmlTransformer,
} from "$lib/helpers/shiki";

/**
 * Browser global values injected by the generated VDL explorer bundle.
 *
 * @remarks
 * In production builds, the plugin injects `window.__vdl_ir` so the explorer can
 * load the schema without performing network requests.
 */
declare global {
  interface Window {
    /**
     * IR schema generated from source definitions.
     *
     * @remarks
     * This value is injected at build time by the VDL plugin runtime.
     */
    __vdl_ir?: IrSchema;
  }
}

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
export const EMPTY_RICH_IR = await enrichIrSchema(EMPTY_IR);

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
  /** The canonical source code for this type without the type docstring. */
  sourceCode: RichIrSchemaSourceCode;
  /** The original IR node */
  sourceIr: IrSchema["types"][number];
};

/**
 * Enriched IR enum entry.
 *
 * Adds stable identifier and router path metadata to the base schema item.
 */
export type RichIrSchemaEnum = IrSchema["enums"][number] & {
  id: string;
  urlPath: string;
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

/**
 * Build a deterministic, URL-friendly identifier for IR entities.
 *
 * The identifier combines a slugified label with the first 8 alphanumeric
 * characters of a content hash, producing stable IDs while reducing collision
 * risk across similarly named entities.
 *
 * @param name Human-readable entity label (for example, a type or enum name).
 * @param obj Entity payload used to derive the hash segment.
 * @returns Identifier in the form `<slug>-<hash8>`.
 */
function createId(name: string, obj: unknown): string {
  const slug = slugify(name);
  const fingerprint = createFingerprint(obj);
  return `${slug}-${fingerprint}`;
}

/**
 * CSS class attached to internal schema reference links rendered by Shiki.
 * This class is styled in the app.css file.
 */
const INTERNAL_IR_LINK_CLASS = "vdl-internal-link";

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
function createIrNodeLinkDictionary(ir: IrSchema): Map<string, string> {
  const links = new Map<string, string>();

  for (const type of ir.types) {
    if (!links.has(type.name)) {
      links.set(type.name, `#/types/${createId(type.name, type)}`);
    }
  }

  for (const en of ir.enums) {
    if (!links.has(en.name)) {
      links.set(en.name, `#/enums/${createId(en.name, en)}`);
    }
  }

  for (const constant of ir.constants) {
    if (!links.has(constant.name)) {
      links.set(
        constant.name,
        `#/constants/${createId(constant.name, constant)}`,
      );
    }
  }

  return links;
}

/**
 * Convert a Shiki class property value into an array of class names.
 *
 * @param classValue Existing class property from a transformed node.
 * @returns Normalized class name array.
 */
function normalizeNodeClasses(classValue: unknown): string[] {
  if (Array.isArray(classValue)) {
    return classValue.filter(
      (value): value is string => typeof value === "string",
    );
  }

  if (typeof classValue === "string") {
    return classValue.split(/\s+/).filter(Boolean);
  }

  return [];
}

/**
 * Read plain text content from a Shiki span node.
 *
 * @param node Shiki node passed to the HTML transformer.
 * @returns The token text when available; otherwise `undefined`.
 */
function getNodeTokenText(node: ShikiHtmlNode): string | undefined {
  if (!node.children?.length) return undefined;

  const tokenText = node.children
    .map((child) => child.value)
    .filter((value): value is string => typeof value === "string")
    .join("");

  return tokenText.length > 0 ? tokenText : undefined;
}

/**
 * Create a Shiki transformer that turns IR symbol tokens into internal links.
 *
 * @param linkDictionary Name-to-URL dictionary for IR symbols.
 * @returns Shiki HTML transformer compatible with `codeToHtml`.
 */
function createIrNodeLinkTransformer(
  linkDictionary: Map<string, string>,
): ShikiHtmlTransformer {
  return {
    name: "vdl-dynamic-links",
    span(node) {
      const tokenText = getNodeTokenText(node);
      if (!tokenText) return;

      const href = linkDictionary.get(tokenText);
      if (!href) return;

      node.tagName = "a";

      const currentClasses = normalizeNodeClasses(node.properties?.class);
      if (!currentClasses.includes(INTERNAL_IR_LINK_CLASS)) {
        currentClasses.push(INTERNAL_IR_LINK_CLASS);
      }

      node.properties = {
        ...node.properties,
        href,
        class: currentClasses.join(" "),
      };
    },
  };
}

/**
 * Enrich an IR schema with stable identifiers and derived doc metadata.
 *
 * IDs are generated by slugifying an item label (`name` or doc `title`) combined
 * with a hash of the item content, keeping them deterministic and collision-resistant.
 *
 * @param ir Base IR schema to enrich.
 * @returns Enriched IR schema with identifiers and doc presentation fields.
 */
async function enrichIrSchema(ir: IrSchema): Promise<RichIrSchema> {
  const linkDictionary = createIrNodeLinkDictionary(ir);
  const linkTransformer = createIrNodeLinkTransformer(linkDictionary);
  const shikiTransformers = [linkTransformer];

  const types: RichIrSchema["types"] = await Promise.all(
    ir.types.map(async (type) => {
      const id = createId(type.name, type);
      const urlPath = `#/types/${id}`;

      const raw = generateVdl(type, { docstrings: "strip-top-level" });
      const htmlLight = await highlighter.highlight(
        raw,
        "vdl",
        "light",
        shikiTransformers,
      );
      const htmlDark = await highlighter.highlight(
        raw,
        "vdl",
        "dark",
        shikiTransformers,
      );
      const sourceCode = { raw, htmlLight, htmlDark };

      const sourceIr = { ...type };
      return { ...type, id, urlPath, sourceCode, sourceIr };
    }),
  );

  const enums: RichIrSchema["enums"] = await Promise.all(
    ir.enums.map(async (en) => {
      const id = createId(en.name, en);
      const urlPath = `#/enums/${id}`;

      const raw = generateVdl(en, { docstrings: "strip-top-level" });
      const htmlLight = await highlighter.highlight(
        raw,
        "vdl",
        "light",
        shikiTransformers,
      );
      const htmlDark = await highlighter.highlight(
        raw,
        "vdl",
        "dark",
        shikiTransformers,
      );
      const sourceCode = { raw, htmlLight, htmlDark };

      const sourceIr = { ...en };
      return { ...en, id, urlPath, sourceCode, sourceIr };
    }),
  );

  const constants: RichIrSchema["constants"] = await Promise.all(
    ir.constants.map(async (constant) => {
      const id = createId(constant.name, constant);
      const urlPath = `#/constants/${id}`;

      const raw = generateVdl(constant, { docstrings: "strip-top-level" });
      const htmlLight = await highlighter.highlight(
        raw,
        "vdl",
        "light",
        shikiTransformers,
      );
      const htmlDark = await highlighter.highlight(
        raw,
        "vdl",
        "dark",
        shikiTransformers,
      );
      const sourceCode = { raw, htmlLight, htmlDark };

      const sourceIr = { ...constant };
      return { ...constant, id, urlPath, sourceCode, sourceIr };
    }),
  );

  const docs: RichIrSchema["docs"] = ir.docs.map((doc) => {
    const title = mdTitle(doc.content);
    const firstParagraph = mdFirstParagraph(doc.content) ?? "";
    const id = createId(title, doc);
    const urlPath = `#/docs/${id}`;

    const raw = doc.content;
    const parsed = marked.parse(raw) as string;
    const htmlLight = DOMPurify.sanitize(parsed);
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
    types,
    enums,
    constants,
    docs,
  };
}

/**
 * Load a development IR schema mock from `ir.local.json`.
 *
 * @remarks
 * This function relies on Vite's `import.meta.glob` with an explicit root-relative
 * path to include the local mock file only when it exists.
 *
 * In development mode, place an `ir.local.json` file at the workspace root to
 * iterate on the explorer UI without running the plugin generation flow.
 *
 * @returns The mock IR schema when available; otherwise {@link EMPTY_IR}.
 */
function findMockIr(): IrSchema {
  type IrMockModule =
    | {
        default?: IrSchema;
      }
    | undefined;

  // Load the local IR mock file using Vite's import.meta.glob.
  const files = import.meta.glob("../../../../ir.local.json", { eager: true });

  const mockModule = files["../../../../ir.local.json"] as IrMockModule;
  if (!mockModule?.default) return EMPTY_IR;

  console.log("[DEV] Default IR loaded from ir.local.json");
  return mockModule.default;
}

/**
 * Check whether a non-empty IR payload is available on the browser global scope.
 *
 * @remarks
 * This acts as a guard before reading the runtime-injected payload and prevents
 * server-side access to `window`.
 *
 * @returns `true` when `window.__vdl_ir` exists and is not an empty object.
 */
function hasProductionIr(): boolean {
  return browser && !!window.__vdl_ir && !isEmptyObject(window.__vdl_ir);
}

/**
 * Load the runtime IR schema injected in browser production builds.
 *
 * @remarks
 * Server-side rendering and missing/empty injected payloads both fall back to
 * {@link EMPTY_IR} to guarantee a predictable shape for downstream consumers.
 *
 * @returns The injected runtime IR schema when available; otherwise {@link EMPTY_IR}.
 */
function findProductionIr(): IrSchema {
  if (!hasProductionIr()) return EMPTY_IR;
  return window.__vdl_ir as IrSchema;
}

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
  if (hasProductionIr()) {
    return await enrichIrSchema(findProductionIr());
  }

  if (dev) {
    return await enrichIrSchema(findMockIr());
  }

  return await enrichIrSchema(EMPTY_IR);
}
