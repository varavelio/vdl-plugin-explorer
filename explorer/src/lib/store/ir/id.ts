import { slugify } from "@varavel/vdl-plugin-sdk/utils/strings";

/**
 * Build a deterministic, URL-friendly identifier for IR entities.
 *
 * The identifier is the slugified label itself.
 *
 * @param name Human-readable entity label (for example, a type or enum name).
 * @returns Identifier in the form `<slug>`.
 */
export function createId(name: string): string {
  return slugify(name);
}
