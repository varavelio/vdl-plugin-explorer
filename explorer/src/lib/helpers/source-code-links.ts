import type { SourceCodeReference } from "$lib/store/ir/index";
import { INTERNAL_IR_LINK_CLASS } from "$lib/store/ir/shiki-links-transformer";

/** Selector for cross-references rendered inside highlighted source. */
const INTERNAL_SOURCE_LINK_SELECTOR = `a.${INTERNAL_IR_LINK_CLASS}[href]`;

/**
 * Action opening stacked source dialogs instead of navigating when a
 * highlighted source cross-reference is clicked.
 *
 * @param node Element containing highlighted source HTML.
 * @param open Lookup of references by href plus opener callback.
 */
export function interceptSourceCodeLinks(
  node: HTMLElement,
  open: {
    references: Map<string, SourceCodeReference>;
    onOpen: (reference: SourceCodeReference) => void;
  },
) {
  function handleClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest(INTERNAL_SOURCE_LINK_SELECTOR);
    if (!(link instanceof HTMLAnchorElement)) return;
    const href = link.getAttribute("href");
    if (!href) return;
    const reference = open.references.get(href);
    if (!reference) return;
    event.preventDefault();
    event.stopPropagation();
    open.onOpen(reference);
  }

  node.addEventListener("click", handleClick);

  return {
    destroy() {
      node.removeEventListener("click", handleClick);
    },
  };
}
