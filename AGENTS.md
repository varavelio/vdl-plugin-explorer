# VDL Plugin Template

## Summary

VDL is the open-source cross-language definition engine for modern stacks. Define your data structures, APIs, contracts, and generate type-safe code for your backend and frontend instantly.

This project contains a VDL plugin written in TypeScript that is responsible for generating code that the VDL binary will then write to the user's system or for returning errors that will be displayed to the user when attempting to generate code using this plugin.

To create the plugin, we are using the VDL Plugin SDK. It is IMPERATIVE that you download and read the manual for using the SDK BEFORE starting ANY task, as it defines and explains many important things. It is also important that you use the manual information when writing tests or any utility code, as it contains helpers that should be used whenever possible to avoid duplicating code and keep the code of all VDL plugins in a similar way.

VDL Plugin SDK manual URL (download and read it): https://vdl-plugin-sdk.varavel.com/llms.txt

## Maintaining this Document

After completing any task, review this file and update it if you made structural changes or discovered patterns worth documenting. Only add information that helps understand how to work with the project. Avoid implementation details, file listings, or trivial changes. This is a general guide, not a changelog.

When updating this document, do so with the context of the entire document in mind; do not simply add new sections at the end, but place them where they make the most sense within the context of the document.

## Working Notes

- Keep implementations aligned with SDK patterns from the manual.
- Use the SDK utility functions when possible to avoid duplicating code.
- The explorer UI favors small shared components for recurring IR presentation concerns (page chrome, markdown docs, recursive type rendering, recursive literal rendering) instead of duplicating that logic across routes.
- RPC routes live under `explorer/src/routes/http-rpcs` as a dedicated special-case hierarchy instead of extending the generic `[nodeType]` explorer route. RPC discovery follows VPP-2: only `@proc` fields inside `@httpRpc` types become procedures, named `proc`/`procs` internally and `procedure`/`procedures` in user text.
- RPC endpoint base URLs are configured via plugin option `rpcBaseUrl` and exposed in the explorer through `window.__vdl_rpc_base_url`. Procedure URLs follow `<baseUrl>/<lowerFirst(RPCName)>/<ProcName>` via `buildRpcProcUrl` in `explorer/src/lib/httpRpc/url.ts`.
- IR route ids are slug-based; only docs can receive suffixes (`-1`, `-2`, ...) when duplicate titles exist.
- For highlighted VDL source snippets, prefer Shiki HTML transformers for dynamic cross-references instead of post-processing generated HTML strings.
- Linkable source snippets are exposed through `RichIrSchema.sourceReferences`; `NodePage` intercepts Shiki `vdl-internal-link` anchors to open stacked source dialogs instead of navigating.
- `e2e/` this directory contains end to end tests. Recommended structure: one fixture folder per test.
- Keep all npm versions pinned to exact versions, never use `^` ranges.
- `explorer` stays on SvelteKit 2 with adapter-static 3 and TypeScript 6. Kit 3 moves config into the Vite plugin and breaks the single-file static setup plus the `@varavel/ui` peer range. TypeScript 7 breaks `svelte-check`. `plugin` can use TypeScript 7.
- After bumping `dprint`, run `dprint config update` to migrate plugin URLs to the `npm:` spec. Keep `biome.json` `$schema` tracking the installed Biome version and run `biome migrate` when config keys deprecate.
- `noAutofocus` stays off via override for `SearchButton.svelte`.
- Procedure playground state (input/output/history) persists per procedure in IndexedDB via `localforage` (`lib/httpRpc/playground/proc-state.svelte.ts`).
- Geist/Geist Mono load from Google Fonts through `@theme` block in `app.css` placed after the kit theme.
- Monaco loads at runtime from the jsDelivr CDN via `@monaco-editor/loader` so the single-file build stays lean. `curlconverter` loads the same way through a dynamic `+esm` import and its tree-sitter WASM files resolve to jsDelivr through the `fetch` redirect patch in `app.html`.
- Snippet code blocks highlight at runtime through a lazily created Shiki highlighter (`highlightSnippet` in `lib/shiki/shiki.svelte.ts`, bundled grammars only, `shellscript` as the `bash` id). `SnippetLang` carries both the Shiki `langCode` and the real download `extension`. `buildCurl` single-quotes the endpoint so the `<baseURL>` placeholder survives curlconverter parsing.
- The input lives inside the search Dialog modal where autofocus is intended, and Biome cannot recognize the custom Dialog as a modal context. The input lives inside the search Dialog modal where autofocus is intended, and Biome cannot recognize the custom Dialog as a modal context.
