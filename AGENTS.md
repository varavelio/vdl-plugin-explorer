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
- RPC endpoint base URLs are configured via plugin option `httpRpcBaseUrl` (comma-separated list, same convention as the HTTP RPC OpenAPI plugin `baseUrl`) and exposed in the explorer through `window.__vdl_http_rpc_base_url`. The settings dialog (header gear, Ctrl/Cmd+,) offers the base URL picker (configured URLs or a custom override with restore) plus custom headers for playground executions through the main store; procedure URLs follow `<baseUrl>/<lowerFirst(HTTP RPC name)>/<ProcName>` via `buildHttpRpcProcUrl` in `explorer/src/lib/helpers/http-rpc-url.ts` (kept in lib because the main store consumes it; the playground UI lives route-locally under `explorer/src/routes/http-rpcs/[httpRpcId]/[procId]/playground/`). settings dialog stays hidden without HTTP RPC in the schema.
- IR route ids are slug-based; only docs can receive suffixes (`-1`, `-2`, ...) when duplicate titles exist.
- For highlighted VDL source snippets, prefer Shiki HTML transformers for dynamic cross-references instead of post-processing generated HTML strings.
- Linkable source snippets are exposed through `RichIrSchema.sourceReferences`; `NodePage` intercepts Shiki `vdl-internal-link` anchors to open stacked source dialogs instead of navigating.
- `e2e/` this directory contains end to end tests. Recommended structure: one fixture folder per test.
- Keep all npm versions pinned to exact versions, never use `^` ranges.
- `explorer` stays on SvelteKit 2 with adapter-static 3 and TypeScript 6. Kit 3 moves config into the Vite plugin and breaks the single-file static setup plus the `@varavel/ui` peer range. TypeScript 7 breaks `svelte-check`. `plugin` can use TypeScript 7.
- After bumping `dprint`, run `dprint config update` to migrate plugin URLs to the `npm:` spec. Keep `biome.json` `$schema` tracking the installed Biome version and run `biome migrate` when config keys deprecate.
- `noAutofocus` stays off via override for `SearchButton.svelte`.
- Procedure playground state (input/output/history, each entry with URL, headers and duration) persists per procedure in IndexedDB via `localforage` (`lib/store/httpRpcPlayground/proc-state.svelte.ts`, isolated like the IR). Snapshots key on `<RPCName>.<ProcName>` inside the deployment-scoped `vdl-explorer-http-rpc` database; the last execution duration shows next to the output date.
- IndexedDB clones with the structured clone algorithm, which rejects the proxies behind `$state`, so persisted payloads are flattened with `$state.snapshot` first; a rejected write fails silently otherwise.
- Restored playground state gates rendering: `ProcPlaygroundState.restored` flips after the async `localforage` read and `persistNow` drops writes until then, and the form mounts only once it is set. Without that gate the form mounts empty, races the load, and the blank state overwrites the stored snapshot. Consumers pass restored data through the bound `value`, so `FormBuilder` needs no separate initial-value prop.
- Playground input writes are immediate, not debounced: pending timers never run before page unload, so a debounce window loses the last edits on reload.
- Persisted UI preferences live in the main store (`settings` and typed `ui` keys, `explorer/src/lib/store/store.svelte.ts`) with per-key debounced writes to a shared IndexedDB database; validators normalize stored payloads. `ui.formEditorMode` drives the default FormBuilder mode and `ui.snippetLang` the selected playground snippet language. Database names are deployment-scoped via `deploymentDbName` (sanitized page path prefix, same convention as the old playground) so explorers on different paths under one domain never share settings or playground history.
- Geist/Geist Mono load from Google Fonts through `@theme` block in `app.css` placed after the kit theme.
- Monaco loads at runtime from the jsDelivr CDN via `@monaco-editor/loader` so the single-file build stays lean. `curlconverter` loads the same way through a dynamic `+esm` import and its tree-sitter WASM files resolve to jsDelivr through the `fetch` redirect patch in `app.html`.
- Snippet code blocks highlight at runtime through a lazily created Shiki highlighter (`highlightSnippet` in `lib/shiki/shiki.svelte.ts`, bundled grammars only, `shellscript` as the `bash` id). `SnippetLang` carries both the Shiki `langCode` and the real download `extension`; the catalog lives in `lib/helpers/code-snippets.ts` (shared by the store validator and the route-local panel). `buildCurl` single-quotes the endpoint so the `<baseURL>` placeholder survives curlconverter parsing.
- The input lives inside the search Dialog modal where autofocus is intended, and Biome cannot recognize the custom Dialog as a modal context. The input lives inside the search Dialog modal where autofocus is intended, and Biome cannot recognize the custom Dialog as a modal context.
