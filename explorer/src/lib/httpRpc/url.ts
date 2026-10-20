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

/**
 * Fallback base URL rendered before the plugin injects the configured one.
 */
export const DEFAULT_RPC_BASE_URL = "https://<baseURL>";

/**
 * Read the RPC base URL injected by the plugin.
 *
 * @param configured Value of `window.__vdl_rpc_base_url` when available.
 * @returns The trimmed base URL without trailing slashes.
 */
export function readRpcBaseUrl(configured: string | undefined): string {
  const trimmed = configured?.trim();
  if (!trimmed) return DEFAULT_RPC_BASE_URL;
  return trimmed.replace(/\/+$/, "");
}
