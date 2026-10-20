<script lang="ts" module>
  import loader from "@monaco-editor/loader";

  /**
   * Monaco bundle loaded from the CDN, shared by every editor instance.
   *
   * The final explorer build is a single HTML file, so Monaco is fetched at
   * runtime instead of being bundled.
   */
  loader.config({
    paths: {
      vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.57.0/min/vs",
    },
  });

  type MonacoApi = typeof import("monaco-editor");

  let monacoPromise: Promise<MonacoApi> | null = null;

  /**
   * Load the Monaco API from the CDN exactly once.
   *
   * @returns The Monaco editor namespace.
   */
  function loadMonaco(): Promise<MonacoApi> {
    if (!monacoPromise) {
      monacoPromise = loader.init() as Promise<MonacoApi>;
    }
    return monacoPromise;
  }
</script>

<script lang="ts">
  import { Loader } from "@varavel/ui";
  import { theme } from "@varavel/ui/runtime";
  import { onMount, untrack } from "svelte";

  interface Props {
    /** Language identifier understood by Monaco (for example `json`). */
    lang?: string;
    /** Editor content bound to the parent component. */
    value?: string;
    /** When true the editor forbids edits. */
    readOnly?: boolean;
    /** CSS height of the editor surface. */
    height?: string;
  }

  let {
    lang = "json",
    value = $bindable(""),
    readOnly = false,
    height = "320px",
  }: Props = $props();

  let container: HTMLElement | null = $state(null);
  let editor: import("monaco-editor").editor.IStandaloneCodeEditor | null =
    $state(null);
  let loading = $state(true);

  onMount(() => {
    let disposed = false;

    (async () => {
      const monaco = await loadMonaco();
      if (disposed || !container) return;

      editor = monaco.editor.create(container, {
        value,
        language: lang,
        theme: theme.resolved === "dark" ? "vs-dark" : "vs",
        readOnly,
        tabSize: 2,
        insertSpaces: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        minimap: { enabled: false },
        padding: { top: 12, bottom: 12 },
        // Wheel events reach the page until the editor takes focus, so
        // scrolling past the editor never traps the page inside it.
        scrollbar: { handleMouseWheel: false },
      });

      editor.onDidFocusEditorText(() => {
        editor?.updateOptions({ scrollbar: { handleMouseWheel: true } });
      });
      editor.onDidBlurEditorText(() => {
        editor?.updateOptions({ scrollbar: { handleMouseWheel: false } });
      });

      editor.onDidChangeModelContent(() => {
        value = editor?.getValue() ?? "";
      });

      loading = false;
    })();

    return () => {
      disposed = true;
      editor?.dispose();
      editor = null;
    };
  });

  $effect(() => {
    const external = value;
    untrack(() => {
      if (editor && editor.getValue() !== external) {
        editor.setValue(external);
      }
    });
  });

  $effect(() => {
    const dark = theme.resolved === "dark";
    untrack(() => {
      editor?.updateOptions({ theme: dark ? "vs-dark" : "vs" });
    });
  });
</script>

{#if loading}
  <div
    class="flex w-full items-center justify-center rounded-md border border-base-400 bg-base-100"
    style:height={height}
  >
    <Loader class="size-8 animate-spin text-content-muted" />
  </div>
{/if}

<div
  bind:this={container}
  class:hidden={loading}
  class="w-full overflow-hidden rounded-md border border-base-400 bg-base-100"
  style:height={height}
></div>
