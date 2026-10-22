/**
 * CDN bundle resolved at runtime so curlconverter and its tree-sitter WASM
 * stay out of the single-file build. The `app.html` fetch patch points the
 * WASM requests at jsDelivr.
 */
const CURLCONVERTER_CDN_URL =
  "https://cdn.jsdelivr.net/npm/curlconverter@4.12.0/+esm";

/**
 * Runtime shape of the curlconverter bundle.
 */
export type CurlConverter = Record<string, (curl: string) => string>;

let converterPromise: Promise<CurlConverter> | null = null;

/**
 * Resolve the curlconverter bundle, preferring the `app.html` preload and
 * falling back to a dynamic import when the preload is unavailable.
 *
 * @returns The converter functions keyed by export name.
 */
export function loadCurlConverter(): Promise<CurlConverter> {
  if (!converterPromise) {
    converterPromise = (async () => {
      const module = (await import(
        /* @vite-ignore */ CURLCONVERTER_CDN_URL
      )) as unknown as CurlConverter;
      return module;
    })();
  }
  return converterPromise;
}

/**
 * Build a curl command for a VPP-2 procedure call.
 *
 * @param endpoint Procedure URL.
 * @param input Request payload, defaults to an empty object.
 * @param headers Extra headers merged over the JSON defaults, later entries
 * winning on case-insensitive name matches.
 * @returns A copy-pasteable curl command.
 */
export function buildCurl(
  endpoint: string,
  input: unknown,
  headers: Record<string, string> = {},
): string {
  // The endpoint travels single-quoted: the default base URL holds the
  // `<baseURL>` placeholder and bare angle brackets parse as shell
  // redirections, which silently truncates the URL for curlconverter.
  const quotedEndpoint = `'${endpoint.replace(/'/g, "'\\''")}'`;
  const payload = JSON.stringify(input ?? {}, null, 2).replace(/'/g, "'\\''");
  const merged = new Map<string, { name: string; value: string }>();
  for (const [name, value] of Object.entries({
    "Content-Type": "application/json",
    Accept: "application/json",
    ...headers,
  })) {
    merged.set(name.toLowerCase(), { name, value });
  }
  const lines = [`curl -X POST ${quotedEndpoint} \\`];
  for (const { name, value } of merged.values()) {
    lines.push(`-H ${JSON.stringify(`${name}: ${value}`)} \\`);
  }
  lines.push(`-d '${payload}'`);
  return lines.join("\n");
}
