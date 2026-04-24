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
   * @returns A promise that resolves to a string containing the HTML representation
   * of the highlighted code. This HTML can be directly inserted into the DOM
   * to display the highlighted code.
   */
  async highlight(
    code: string,
    lang: ShikiHighlighterLang = "vdl",
    theme: "light" | "dark" = "light",
  ): Promise<string> {
    if (!this.initialized) await this.init();
    const shikiTheme = theme === "dark" ? "github-dark" : "github-light";
    return this.#highlighter.codeToHtml(code, { lang, theme: shikiTheme });
  }
}

/**
 * Singleton instance of the ShikiHighlighter class that can be imported and used
 * throughout the application to apply syntax highlighting to code snippets.
 */
export const highlighter = new ShikiHighlighter();
