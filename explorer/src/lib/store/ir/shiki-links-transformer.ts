import type { ShikiHtmlNode, ShikiHtmlTransformer } from "$lib/helpers/shiki";

/**
 * CSS class attached to internal schema reference links rendered by Shiki.
 * This class is styled in the app.css file.
 */
const INTERNAL_IR_LINK_CLASS = "vdl-internal-link";

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
export function createIrNodeLinkTransformer(
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
