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
 * One output language offered by the snippets panel.
 */
export type SnippetLang = {
  group: string;
  langCode: string;
  label: string;
  converter: string | null;
};

/**
 * Languages offered by the snippets panel with their curlconverter entry.
 *
 * A null converter renders the raw curl command.
 */
export const SNIPPET_LANGS: SnippetLang[] = [
  {
    group: "Ansible",
    langCode: "yaml",
    label: "Ansible",
    converter: "toAnsible",
  },
  { group: "Bash", langCode: "bash", label: "Curl", converter: null },
  { group: "Bash", langCode: "bash", label: "Wget", converter: "toWget" },
  { group: "C", langCode: "c", label: "C", converter: "toC" },
  { group: "C#", langCode: "csharp", label: "C#", converter: "toCSharp" },
  {
    group: "Clojure",
    langCode: "clojure",
    label: "Clojure",
    converter: "toClojure",
  },
  { group: "Dart", langCode: "dart", label: "Dart", converter: "toDart" },
  {
    group: "Elixir",
    langCode: "elixir",
    label: "Elixir",
    converter: "toElixir",
  },
  { group: "Go", langCode: "go", label: "Go", converter: "toGo" },
  { group: "HTTP", langCode: "http", label: "HTTP", converter: "toHTTP" },
  { group: "HTTPie", langCode: "bash", label: "HTTPie", converter: "toHttpie" },
  {
    group: "Java",
    langCode: "java",
    label: "Java HttpClient",
    converter: "toJava",
  },
  {
    group: "Java",
    langCode: "java",
    label: "Java HttpUrlConnection",
    converter: "toJavaHttpUrlConnection",
  },
  {
    group: "Java",
    langCode: "java",
    label: "Java Jsoup",
    converter: "toJavaJsoup",
  },
  {
    group: "Java",
    langCode: "java",
    label: "Java OkHttp",
    converter: "toJavaOkHttp",
  },
  {
    group: "JavaScript",
    langCode: "javascript",
    label: "JavaScript Fetch",
    converter: "toJavaScript",
  },
  {
    group: "JavaScript",
    langCode: "javascript",
    label: "JavaScript JQuery",
    converter: "toJavaScriptJquery",
  },
  {
    group: "JavaScript",
    langCode: "javascript",
    label: "JavaScript XHR",
    converter: "toJavaScriptXHR",
  },
  { group: "Julia", langCode: "julia", label: "Julia", converter: "toJulia" },
  { group: "JSON", langCode: "json", label: "JSON", converter: "toJsonString" },
  {
    group: "Kotlin",
    langCode: "kotlin",
    label: "Kotlin",
    converter: "toKotlin",
  },
  { group: "Lua", langCode: "lua", label: "Lua", converter: "toLua" },
  {
    group: "MATLAB",
    langCode: "matlab",
    label: "MATLAB",
    converter: "toMATLAB",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    label: "Node.js Axios",
    converter: "toNodeAxios",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    label: "Node.js Got",
    converter: "toNodeGot",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    label: "Node.js Ky",
    converter: "toNodeKy",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    label: "Node.js node-fetch",
    converter: "toNodeFetch",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    label: "Node.js request",
    converter: "toNodeRequest",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    label: "Node.js SuperAgent",
    converter: "toNodeSuperAgent",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    label: "Node.js http",
    converter: "toNodeHttp",
  },
  {
    group: "Objective-C",
    langCode: "objective-c",
    label: "Objective-C",
    converter: "toObjectiveC",
  },
  { group: "OCaml", langCode: "ocaml", label: "OCaml", converter: "toOCaml" },
  { group: "Perl", langCode: "perl", label: "Perl", converter: "toPerl" },
  { group: "PHP", langCode: "php", label: "PHP Curl", converter: "toPhp" },
  {
    group: "PHP",
    langCode: "php",
    label: "PHP Guzzle",
    converter: "toPhpGuzzle",
  },
  {
    group: "PowerShell",
    langCode: "powershell",
    label: "PowerShell",
    converter: "toPowershellWebRequest",
  },
  {
    group: "Python",
    langCode: "python",
    label: "Python Requests",
    converter: "toPython",
  },
  {
    group: "Python",
    langCode: "python",
    label: "Python http.client",
    converter: "toPythonHttp",
  },
  { group: "R", langCode: "r", label: "R httr", converter: "toR" },
  { group: "R", langCode: "r", label: "R httr2", converter: "toRHttr2" },
  {
    group: "Ruby",
    langCode: "ruby",
    label: "Ruby Net::HTTP",
    converter: "toRuby",
  },
  {
    group: "Ruby",
    langCode: "ruby",
    label: "Ruby HTTParty",
    converter: "toRubyHttparty",
  },
  { group: "Rust", langCode: "rust", label: "Rust", converter: "toRust" },
  { group: "Swift", langCode: "swift", label: "Swift", converter: "toSwift" },
];

/**
 * Build a curl command for a VPP-2 procedure call.
 *
 * @param endpoint Procedure URL.
 * @param input Request payload, defaults to an empty object.
 * @returns A copy-pasteable curl command.
 */
export function buildCurl(endpoint: string, input: unknown): string {
  const payload = JSON.stringify(input ?? {}, null, 2).replace(/'/g, "'\\''");
  return [
    `curl -X POST ${endpoint} \\`,
    `-H ${JSON.stringify("Content-Type: application/json")} \\`,
    `-H ${JSON.stringify("Accept: application/json")} \\`,
    `-d '${payload}'`,
  ].join("\n");
}
