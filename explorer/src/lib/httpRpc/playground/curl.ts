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
  /** Shiki language id used to highlight the snippet. */
  langCode: string;
  /** Real file extension used for the download action. */
  extension: string;
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
    extension: "yml",
    label: "Ansible",
    converter: "toAnsible",
  },
  {
    group: "Bash",
    langCode: "shellscript",
    extension: "sh",
    label: "Curl",
    converter: null,
  },
  {
    group: "Bash",
    langCode: "shellscript",
    extension: "sh",
    label: "Wget",
    converter: "toWget",
  },
  { group: "C", langCode: "c", extension: "c", label: "C", converter: "toC" },
  {
    group: "C#",
    langCode: "csharp",
    extension: "cs",
    label: "C#",
    converter: "toCSharp",
  },
  {
    group: "Clojure",
    langCode: "clojure",
    extension: "clj",
    label: "Clojure",
    converter: "toClojure",
  },
  {
    group: "Dart",
    langCode: "dart",
    extension: "dart",
    label: "Dart",
    converter: "toDart",
  },
  {
    group: "Elixir",
    langCode: "elixir",
    extension: "ex",
    label: "Elixir",
    converter: "toElixir",
  },
  {
    group: "Go",
    langCode: "go",
    extension: "go",
    label: "Go",
    converter: "toGo",
  },
  {
    group: "HTTP",
    langCode: "http",
    extension: "http",
    label: "HTTP",
    converter: "toHTTP",
  },
  {
    group: "HTTPie",
    langCode: "shellscript",
    extension: "sh",
    label: "HTTPie",
    converter: "toHttpie",
  },
  {
    group: "Java",
    langCode: "java",
    extension: "java",
    label: "Java HttpClient",
    converter: "toJava",
  },
  {
    group: "Java",
    langCode: "java",
    extension: "java",
    label: "Java HttpUrlConnection",
    converter: "toJavaHttpUrlConnection",
  },
  {
    group: "Java",
    langCode: "java",
    extension: "java",
    label: "Java Jsoup",
    converter: "toJavaJsoup",
  },
  {
    group: "Java",
    langCode: "java",
    extension: "java",
    label: "Java OkHttp",
    converter: "toJavaOkHttp",
  },
  {
    group: "JavaScript",
    langCode: "javascript",
    extension: "js",
    label: "JavaScript Fetch",
    converter: "toJavaScript",
  },
  {
    group: "JavaScript",
    langCode: "javascript",
    extension: "js",
    label: "JavaScript JQuery",
    converter: "toJavaScriptJquery",
  },
  {
    group: "JavaScript",
    langCode: "javascript",
    extension: "js",
    label: "JavaScript XHR",
    converter: "toJavaScriptXHR",
  },
  {
    group: "Julia",
    langCode: "julia",
    extension: "jl",
    label: "Julia",
    converter: "toJulia",
  },
  {
    group: "JSON",
    langCode: "json",
    extension: "json",
    label: "JSON",
    converter: "toJsonString",
  },
  {
    group: "Kotlin",
    langCode: "kotlin",
    extension: "kt",
    label: "Kotlin",
    converter: "toKotlin",
  },
  {
    group: "Lua",
    langCode: "lua",
    extension: "lua",
    label: "Lua",
    converter: "toLua",
  },
  {
    group: "MATLAB",
    langCode: "matlab",
    extension: "m",
    label: "MATLAB",
    converter: "toMATLAB",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    extension: "js",
    label: "Node.js Axios",
    converter: "toNodeAxios",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    extension: "js",
    label: "Node.js Got",
    converter: "toNodeGot",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    extension: "js",
    label: "Node.js Ky",
    converter: "toNodeKy",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    extension: "js",
    label: "Node.js node-fetch",
    converter: "toNodeFetch",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    extension: "js",
    label: "Node.js request",
    converter: "toNodeRequest",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    extension: "js",
    label: "Node.js SuperAgent",
    converter: "toNodeSuperAgent",
  },
  {
    group: "Node.js",
    langCode: "javascript",
    extension: "js",
    label: "Node.js http",
    converter: "toNodeHttp",
  },
  {
    group: "Objective-C",
    langCode: "objective-c",
    extension: "m",
    label: "Objective-C",
    converter: "toObjectiveC",
  },
  {
    group: "OCaml",
    langCode: "ocaml",
    extension: "ml",
    label: "OCaml",
    converter: "toOCaml",
  },
  {
    group: "Perl",
    langCode: "perl",
    extension: "pl",
    label: "Perl",
    converter: "toPerl",
  },
  {
    group: "PHP",
    langCode: "php",
    extension: "php",
    label: "PHP Curl",
    converter: "toPhp",
  },
  {
    group: "PHP",
    langCode: "php",
    extension: "php",
    label: "PHP Guzzle",
    converter: "toPhpGuzzle",
  },
  {
    group: "PowerShell",
    langCode: "powershell",
    extension: "ps1",
    label: "PowerShell",
    converter: "toPowershellWebRequest",
  },
  {
    group: "Python",
    langCode: "python",
    extension: "py",
    label: "Python Requests",
    converter: "toPython",
  },
  {
    group: "Python",
    langCode: "python",
    extension: "py",
    label: "Python http.client",
    converter: "toPythonHttp",
  },
  {
    group: "R",
    langCode: "r",
    extension: "r",
    label: "R httr",
    converter: "toR",
  },
  {
    group: "R",
    langCode: "r",
    extension: "r",
    label: "R httr2",
    converter: "toRHttr2",
  },
  {
    group: "Ruby",
    langCode: "ruby",
    extension: "rb",
    label: "Ruby Net::HTTP",
    converter: "toRuby",
  },
  {
    group: "Ruby",
    langCode: "ruby",
    extension: "rb",
    label: "Ruby HTTParty",
    converter: "toRubyHttparty",
  },
  {
    group: "Rust",
    langCode: "rust",
    extension: "rs",
    label: "Rust",
    converter: "toRust",
  },
  {
    group: "Swift",
    langCode: "swift",
    extension: "swift",
    label: "Swift",
    converter: "toSwift",
  },
];

/**
 * Build a curl command for a VPP-2 procedure call.
 *
 * @param endpoint Procedure URL.
 * @param input Request payload, defaults to an empty object.
 * @returns A copy-pasteable curl command.
 */
export function buildCurl(endpoint: string, input: unknown): string {
  // The endpoint travels single-quoted: the default base URL holds the
  // `<baseURL>` placeholder and bare angle brackets parse as shell
  // redirections, which silently truncates the URL for curlconverter.
  const quotedEndpoint = `'${endpoint.replace(/'/g, "'\\''")}'`;
  const payload = JSON.stringify(input ?? {}, null, 2).replace(/'/g, "'\\''");
  return [
    `curl -X POST ${quotedEndpoint} \\`,
    `-H ${JSON.stringify("Content-Type: application/json")} \\`,
    `-H ${JSON.stringify("Accept: application/json")} \\`,
    `-d '${payload}'`,
  ].join("\n");
}
