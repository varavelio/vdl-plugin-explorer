/**
 * One output language offered by the snippets panel.
 */
export type SnippetLang = {
  langCode: string;
  extension: string;
  label: string;
  curlConverter: string | null;
};

/**
 * Languages offered by the snippets panel with their curlconverter entry.
 *
 * A null converter renders the raw curl command.
 */
export const SNIPPET_LANGS: SnippetLang[] = [
  {
    langCode: "yaml",
    extension: "yml",
    label: "Ansible",
    curlConverter: "toAnsible",
  },
  {
    langCode: "c",
    extension: "c",
    label: "C",
    curlConverter: "toC",
  },
  {
    langCode: "csharp",
    extension: "cs",
    label: "C#",
    curlConverter: "toCSharp",
  },
  {
    langCode: "clojure",
    extension: "clj",
    label: "Clojure",
    curlConverter: "toClojure",
  },
  {
    langCode: "shellscript",
    extension: "sh",
    label: "Curl",
    curlConverter: null,
  },
  {
    langCode: "dart",
    extension: "dart",
    label: "Dart",
    curlConverter: "toDart",
  },
  {
    langCode: "elixir",
    extension: "ex",
    label: "Elixir",
    curlConverter: "toElixir",
  },
  {
    langCode: "go",
    extension: "go",
    label: "Go",
    curlConverter: "toGo",
  },
  {
    langCode: "http",
    extension: "http",
    label: "HTTP",
    curlConverter: "toHTTP",
  },
  {
    langCode: "shellscript",
    extension: "sh",
    label: "HTTPie",
    curlConverter: "toHttpie",
  },
  {
    langCode: "java",
    extension: "java",
    label: "Java HttpClient",
    curlConverter: "toJava",
  },
  {
    langCode: "java",
    extension: "java",
    label: "Java HttpUrlConnection",
    curlConverter: "toJavaHttpUrlConnection",
  },
  {
    langCode: "java",
    extension: "java",
    label: "Java Jsoup",
    curlConverter: "toJavaJsoup",
  },
  {
    langCode: "java",
    extension: "java",
    label: "Java OkHttp",
    curlConverter: "toJavaOkHttp",
  },
  {
    langCode: "javascript",
    extension: "js",
    label: "JavaScript Fetch",
    curlConverter: "toJavaScript",
  },
  {
    langCode: "javascript",
    extension: "js",
    label: "JavaScript JQuery",
    curlConverter: "toJavaScriptJquery",
  },
  {
    langCode: "javascript",
    extension: "js",
    label: "JavaScript XHR",
    curlConverter: "toJavaScriptXHR",
  },
  {
    langCode: "json",
    extension: "json",
    label: "JSON",
    curlConverter: "toJsonString",
  },
  {
    langCode: "julia",
    extension: "jl",
    label: "Julia",
    curlConverter: "toJulia",
  },
  {
    langCode: "kotlin",
    extension: "kt",
    label: "Kotlin",
    curlConverter: "toKotlin",
  },
  {
    langCode: "lua",
    extension: "lua",
    label: "Lua",
    curlConverter: "toLua",
  },
  {
    langCode: "matlab",
    extension: "m",
    label: "MATLAB",
    curlConverter: "toMATLAB",
  },
  {
    langCode: "javascript",
    extension: "js",
    label: "Node.js Axios",
    curlConverter: "toNodeAxios",
  },
  {
    langCode: "javascript",
    extension: "js",
    label: "Node.js Got",
    curlConverter: "toNodeGot",
  },
  {
    langCode: "javascript",
    extension: "js",
    label: "Node.js http",
    curlConverter: "toNodeHttp",
  },
  {
    langCode: "javascript",
    extension: "js",
    label: "Node.js Ky",
    curlConverter: "toNodeKy",
  },
  {
    langCode: "javascript",
    extension: "js",
    label: "Node.js node-fetch",
    curlConverter: "toNodeFetch",
  },
  {
    langCode: "javascript",
    extension: "js",
    label: "Node.js request",
    curlConverter: "toNodeRequest",
  },
  {
    langCode: "javascript",
    extension: "js",
    label: "Node.js SuperAgent",
    curlConverter: "toNodeSuperAgent",
  },
  {
    langCode: "objective-c",
    extension: "m",
    label: "Objective-C",
    curlConverter: "toObjectiveC",
  },
  {
    langCode: "ocaml",
    extension: "ml",
    label: "OCaml",
    curlConverter: "toOCaml",
  },
  {
    langCode: "perl",
    extension: "pl",
    label: "Perl",
    curlConverter: "toPerl",
  },
  {
    langCode: "php",
    extension: "php",
    label: "PHP Curl",
    curlConverter: "toPhp",
  },
  {
    langCode: "php",
    extension: "php",
    label: "PHP Guzzle",
    curlConverter: "toPhpGuzzle",
  },
  {
    langCode: "powershell",
    extension: "ps1",
    label: "PowerShell",
    curlConverter: "toPowershellWebRequest",
  },
  {
    langCode: "python",
    extension: "py",
    label: "Python http.client",
    curlConverter: "toPythonHttp",
  },
  {
    langCode: "python",
    extension: "py",
    label: "Python Requests",
    curlConverter: "toPython",
  },
  {
    langCode: "r",
    extension: "r",
    label: "R httr",
    curlConverter: "toR",
  },
  {
    langCode: "r",
    extension: "r",
    label: "R httr2",
    curlConverter: "toRHttr2",
  },
  {
    langCode: "ruby",
    extension: "rb",
    label: "Ruby HTTParty",
    curlConverter: "toRubyHttparty",
  },
  {
    langCode: "ruby",
    extension: "rb",
    label: "Ruby Net::HTTP",
    curlConverter: "toRuby",
  },
  {
    langCode: "rust",
    extension: "rs",
    label: "Rust",
    curlConverter: "toRust",
  },
  {
    langCode: "swift",
    extension: "swift",
    label: "Swift",
    curlConverter: "toSwift",
  },
  {
    langCode: "shellscript",
    extension: "sh",
    label: "Wget",
    curlConverter: "toWget",
  },
];
