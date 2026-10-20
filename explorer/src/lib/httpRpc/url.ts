/**
 * Lowercase the first Unicode letter of a value and leave the rest untouched.
 *
 * @param value Text to transform, typically an RPC service name.
 * @returns The value with its first character lowercased.
 */
export function lowerFirst(value: string): string {
  if (!value) return value;

  const [first, ...rest] = Array.from(value);
  return `${first.toLowerCase()}${rest.join("")}`;
}

/**
 * Build the HTTP endpoint URL for an RPC procedure following VPP-2.
 *
 * @param baseUrl Configured base URL, with or without trailing slashes.
 * @param rpcName RPC service name, with its first letter lowercased.
 * @param procName Procedure name, used verbatim.
 * @returns The canonical `<baseUrl>/<lowerFirst(rpcName)>/<procName>` URL.
 */
export function buildRpcProcUrl(
  baseUrl: string,
  rpcName: string,
  procName: string,
): string {
  const normalizedBase = baseUrl.trim().replace(/\/+$/, "");
  return `${normalizedBase}/${lowerFirst(rpcName)}/${procName}`;
}
