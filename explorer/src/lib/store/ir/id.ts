import { fingerprint as createFingerprint } from "@varavel/vdl-plugin-sdk/utils/crypto";
import { slugify } from "@varavel/vdl-plugin-sdk/utils/strings";

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
export function createId(name: string, obj: unknown): string {
  const slug = slugify(name);
  const fingerprint = createFingerprint(obj);
  return `${slug}-${fingerprint}`;
}
