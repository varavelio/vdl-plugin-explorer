/**
 * Authentication token found in a procedure response.
 */
export type DiscoveredAuthToken = {
  /** Original key holding the token. */
  key: string;
  /** Token value. */
  value: string;
  /** Dot path to the token (for example `data.auth.accessToken`). */
  path: string;
  /** Depth where the token was found (`0` is the root level). */
  depth: number;
};

/**
 * Key patterns matching common authentication token naming conventions:
 * anything containing `token`, an `apiKey`-style key ending in `key`, and
 * the exact `jwt`, `bearer`, `auth`, `access`, `refresh` and `session` keys.
 */
const TOKEN_KEY_PATTERNS = [
  /.*token.*/i,
  /^jwt$/i,
  /^bearer$/i,
  /.*key$/i,
  /^auth$/i,
  /^access$/i,
  /^refresh$/i,
  /^session$/i,
];

/** Maximum nesting depth searched for tokens. */
const MAX_TOKEN_DEPTH = 10;

function isTokenKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return TOKEN_KEY_PATTERNS.some((pattern) => pattern.test(normalized));
}

function searchTokens(
  value: unknown,
  path: string,
  depth: number,
): DiscoveredAuthToken[] {
  if (value === null || value === undefined || depth > MAX_TOKEN_DEPTH)
    return [];
  const found: DiscoveredAuthToken[] = [];

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      found.push(
        ...searchTokens(
          item,
          path ? `${path}[${index}]` : `[${index}]`,
          depth + 1,
        ),
      );
    });
    return found;
  }

  if (typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      const entryPath = path ? `${path}.${key}` : key;
      if (
        isTokenKey(key) &&
        typeof entry === "string" &&
        entry.trim().length > 0
      ) {
        found.push({ key, value: entry, path: entryPath, depth });
      }
      if (typeof entry === "object" && entry !== null) {
        found.push(...searchTokens(entry, entryPath, depth + 1));
      }
    }
  }

  return found;
}

/**
 * Find authentication tokens in a procedure response.
 *
 * @param data Parsed response object or its JSON text.
 * @returns Discovered tokens, shallowest first.
 */
export function discoverAuthToken(data: unknown): DiscoveredAuthToken[] {
  let parsed: unknown = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      return [];
    }
  }
  if (parsed === null || typeof parsed !== "object") return [];
  return searchTokens(parsed, "", 0).sort((a, b) =>
    a.depth === b.depth ? a.path.localeCompare(b.path) : a.depth - b.depth,
  );
}
