/**
 * The URL of the CDN pointing to the VDL grammar file for syntax highlighting.
 */
const VDL_GRAMMAR_URL =
  "https://cdn.jsdelivr.net/gh/varavelio/vdl@v0.5.0-alpha.5/editors/vscode/language/vdl.tmLanguage.json";

/**
 * The supported languages for the Shiki highlighter. Currently, only "vdl" is
 * supported, but this can be extended if needed.
 */
type ShikiHighlighterLang = "vdl";

/**
 * Minimal shape of a text child node emitted by Shiki HTML transformers.
 */
export type ShikiHtmlTextChildNode = {
  type?: string;
  value?: string;
};

/**
 * Minimal shape for child nodes emitted by Shiki HTML transformers.
 */
export type ShikiHtmlChildNode = ShikiHtmlTextChildNode | ShikiHtmlNode;

/**
 * Minimal shape of an HTML node emitted by Shiki HTML transformers.
 */
export type ShikiHtmlNode = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: ShikiHtmlChildNode[];
};

/**
 * Minimal transformer shape accepted by the local Shiki integration.
 *
 * @remarks
 * We keep this type intentionally lightweight because Shiki is loaded from a
 * CDN URL and does not provide local TypeScript types in this project.
 */
export type ShikiHtmlTransformer = {
  name: string;
  pre?: (node: ShikiHtmlNode) => void;
  span?: (node: ShikiHtmlNode) => void;
};

/**
 * Drops the background Shiki inlines on `<pre>` so the stylesheet owns the
 * code background. Token colors stay inline; only the surface comes from CSS.
 */
const STRIP_PRE_BACKGROUND: ShikiHtmlTransformer = {
  name: "vdl:strip-pre-background",
  pre(node) {
    const properties = node.properties;
    if (typeof properties?.style !== "string") return;
    const kept = properties.style
      .split(";")
      .map((rule) => rule.trim())
      .filter((rule) => rule && !rule.startsWith("background"));
    if (kept.length > 0) {
      properties.style = kept.join("; ");
    } else {
      delete properties.style;
    }
  },
};

/**
 * A class that provides syntax highlighting functionality using the Shiki library.
 */
class ShikiHighlighter {
  /**
   * A reactive variable that indicates whether the Shiki highlighter has been initialized.
   */
  initialized = $state(false);

  /**
   * A private variable that holds the promise for the initialization process. This is used
   * to avoid race conditions when multiple calls to the highlight method are made before
   * the highlighter is fully initialized.
   */
  #initPromise: Promise<void> | null = null;

  // biome-ignore lint/suspicious/noExplicitAny: We are using the CDN so we don't have types
  #highlighter: any = null;

  constructor() {
    this.init();
  }

  /**
   * Initializes the Shiki highlighter by loading the library from the CDN
   * and fetching the VDL grammar. This method is called automatically when the
   * ShikiHighlighter instance is created.
   */
  private async init() {
    if (this.#initPromise) return this.#initPromise;

    this.#initPromise = (async () => {
      const [{ createHighlighter }, grammarRequest] = await Promise.all([
        // @ts-expect-error: We are using the CDN so we don't have types
        import("https://esm.run/shiki@4.0.2"),
        fetch(VDL_GRAMMAR_URL),
      ]);

      if (!grammarRequest.ok) {
        throw new Error("Failed to load VDL grammar for syntax highlighting");
      }
      const grammar = await grammarRequest.json();

      this.#highlighter = await createHighlighter({
        themes: ["github-dark", "github-light"],
        langs: [{ ...grammar, name: "vdl" }],
      });

      this.initialized = true;
    })();

    return this.#initPromise;
  }

  /**
   * Highlights the given code with syntax highlighting.
   *
   * @param code The code to be highlighted. This should be a string containing the
   * source code that you want to apply syntax highlighting to.
   * @param lang The programming language of the code. This should be a string that
   * matches one of the supported languages.
   * @param theme The visual theme variant used to generate highlighted HTML.
   * @param transformers Optional HTML transformers to mutate highlighted tokens.
   * @returns A promise that resolves to a string containing the HTML representation
   * of the highlighted code. This HTML can be directly inserted into the DOM
   * to display the highlighted code.
   */
  async highlight(
    code: string,
    lang: ShikiHighlighterLang = "vdl",
    theme: "light" | "dark" = "light",
    transformers: ShikiHtmlTransformer[] = [],
  ): Promise<string> {
    if (!this.initialized) await this.init();
    const shikiTheme = theme === "dark" ? "github-dark" : "github-light";
    return this.#highlighter.codeToHtml(code, {
      lang,
      theme: shikiTheme,
      transformers: [...transformers, STRIP_PRE_BACKGROUND],
    });
  }
}

/**
 * Singleton instance of the ShikiHighlighter class that can be imported and used
 * throughout the application to apply syntax highlighting to code snippets.
 */
export const highlighter = new ShikiHighlighter();

/**
 * Bundled Shiki languages needed by the playground code snippets, matching
 * the `langCode` values offered in `SNIPPET_LANGS`.
 */
const SNIPPET_GRAMMAR_LANGS = [
  "shellscript",
  "c",
  "clojure",
  "csharp",
  "dart",
  "elixir",
  "go",
  "http",
  "java",
  "javascript",
  "json",
  "julia",
  "kotlin",
  "lua",
  "matlab",
  "objective-c",
  "ocaml",
  "perl",
  "php",
  "powershell",
  "python",
  "r",
  "ruby",
  "rust",
  "swift",
  "yaml",
];

// biome-ignore lint/suspicious/noExplicitAny: We are using the CDN so we don't have types
let snippetHighlighter: any = null;
let snippetInitPromise: Promise<void> | null = null;

/**
 * Highlight a playground snippet with the bundled Shiki grammars. The
 * highlighter is created lazily on first use so visitors who never open
 * the snippets never download the extra grammars.
 *
 * @param code Snippet source to highlight.
 * @param lang Shiki language id, see `SNIPPET_GRAMMAR_LANGS`.
 * @param theme Visual theme variant used to generate highlighted HTML.
 * @returns Highlighted HTML, or undefined when highlighting is unavailable.
 */
export async function highlightSnippet(
  code: string,
  lang: string,
  theme: "light" | "dark",
): Promise<string | undefined> {
  try {
    if (!snippetInitPromise) {
      snippetInitPromise = (async () => {
        const [{ createHighlighter }] = await Promise.all([
          // @ts-expect-error: We are using the CDN so we don't have types
          import("https://esm.run/shiki@4.0.2"),
        ]);
        snippetHighlighter = await createHighlighter({
          themes: ["github-dark", "github-light"],
          langs: SNIPPET_GRAMMAR_LANGS,
        });
      })();
    }
    await snippetInitPromise;
    return snippetHighlighter.codeToHtml(code, {
      lang,
      theme: theme === "dark" ? "github-dark" : "github-light",
      transformers: [STRIP_PRE_BACKGROUND],
    });
  } catch {
    return undefined;
  }
}
