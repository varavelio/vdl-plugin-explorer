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
 * Read plain text emitted by direct text children of a Shiki node.
 *
 * @param node Shiki node passed to the HTML transformer.
 * @returns Concatenated text from direct text children.
 */
function getNodeDirectText(node: ShikiHtmlNode): string {
  if (!node.children?.length) return "";

  return node.children
    .map((child) => ("value" in child ? child.value : undefined))
    .filter((value): value is string => typeof value === "string")
    .join("");
}

/**
 * Read plain text content from a Shiki span node.
 *
 * @param node Shiki node passed to the HTML transformer.
 * @returns The token text when available; otherwise `undefined`.
 */
function getNodeTokenText(node: ShikiHtmlNode): string | undefined {
  const tokenText = getNodeDirectText(node);

  const trimmedTokenText = tokenText.trim();

  return trimmedTokenText.length > 0 ? trimmedTokenText : undefined;
}

/**
 * Read leading and trailing whitespace surrounding a token inside a span.
 *
 * @param node Shiki node passed to the HTML transformer.
 * @returns Whitespace around the token text.
 */
function getNodeTokenWhitespace(node: ShikiHtmlNode): {
  leading: string;
  trailing: string;
} {
  const tokenText = getNodeDirectText(node);
  if (!tokenText) {
    return { leading: "", trailing: "" };
  }

  const leading = tokenText.match(/^\s*/)?.[0] ?? "";
  const trailing = tokenText.match(/\s*$/)?.[0] ?? "";
  return { leading, trailing };
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

      const { leading, trailing } = getNodeTokenWhitespace(node);

      if (leading || trailing) {
        const inheritedStyle =
          typeof node.properties?.style === "string"
            ? node.properties.style
            : "";

        const linkNode: ShikiHtmlNode = {
          type: "element",
          tagName: "a",
          properties: {
            href,
            class: INTERNAL_IR_LINK_CLASS,
            ...(inheritedStyle ? { style: inheritedStyle } : {}),
          },
          children: [{ type: "text", value: tokenText }],
        };

        node.type = "element";
        node.tagName = "span";
        node.children = [
          ...(leading ? [{ type: "text", value: leading }] : []),
          linkNode,
          ...(trailing ? [{ type: "text", value: trailing }] : []),
        ];
        return;
      }

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
