/**
 * Lowercase the first Unicode letter of a value and leave the rest untouched.
 *
 * @param value Text to transform, typically an HTTP RPC service name.
 * @returns The value with its first character lowercased.
 */
export function lowerFirst(value: string): string {
  if (!value) return value;

  const [first, ...rest] = Array.from(value);
  return `${first.toLowerCase()}${rest.join("")}`;
}

/**
 * Build the HTTP endpoint URL for an HTTP RPC procedure following VPP-2.
 *
 * @param baseUrl Configured base URL, with or without trailing slashes.
 * @param httpRpcName HTTP RPC service name, with its first letter lowercased.
 * @param procName Procedure name, used verbatim.
 * @returns The canonical `<baseUrl>/<lowerFirst(httpRpcName)>/<procName>` URL.
 */
export function buildHttpRpcProcUrl(
  baseUrl: string,
  httpRpcName: string,
  procName: string,
): string {
  const normalizedBase = baseUrl.trim().replace(/\/+$/, "");
  return `${normalizedBase}/${lowerFirst(httpRpcName)}/${procName}`;
}

/**
 * Fallback base URL rendered before the plugin injects the configured one.
 */
export const DEFAULT_HTTP_RPC_BASE_URL = "https://<baseURL>";

/**
 * Parse the comma-separated HTTP RPC base URL list injected by the plugin,
 * following the same convention as the `baseUrl` option of the HTTP RPC
 * OpenAPI plugin.
 *
 * @param configured Value of `window.__vdl_http_rpc_base_url` when available.
 * @returns The configured URLs without trailing slashes, or the fallback.
 */
export function parseHttpRpcBaseUrls(configured: string | undefined): string[] {
  const urls = (configured ?? "")
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter((url) => url.length > 0);
  return urls.length > 0 ? urls : [DEFAULT_HTTP_RPC_BASE_URL];
}
