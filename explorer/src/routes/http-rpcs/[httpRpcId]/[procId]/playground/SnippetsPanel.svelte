<script lang="ts">
  import { PanelRightClose } from "@lucide/svelte";
  import { Button, CodeBlock, Heading, Select, Tooltip } from "@varavel/ui";
  import { theme as runtimeTheme } from "@varavel/ui/runtime";
  import { onMount } from "svelte";
  import { SNIPPET_LANGS } from "$lib/helpers/code-snippets";
  import { highlightSnippet } from "$lib/shiki/shiki.svelte";
  import { store } from "$lib/store";
  import { buildCurl, type CurlConverter, loadCurlConverter } from "./curl";

  interface Props {
    /** Procedure URL the snippets target. */
    endpoint: string;
    /** Current request payload rendered into the snippets. */
    input: unknown;
    /** Extra headers merged over the JSON defaults. */
    headers?: Record<string, string>;
    /** Close handler; when omitted no close button renders. */
    onClose?: () => void;
  }

  let { endpoint, input, headers = {}, onClose }: Props = $props();

  let converter: CurlConverter | null = $state(null);
  let converterFailed = $state(false);

  let highlighted = $state<string | undefined>(undefined);

  let curl = $derived(buildCurl(endpoint, input, headers));

  onMount(() => {
    loadCurlConverter()
      .then((loaded) => {
        converter = loaded;
      })
      .catch(() => {
        converterFailed = true;
      });
  });

  let selected = $derived(
    SNIPPET_LANGS.find((lang) => lang.label === store.ui.snippetLang) ??
      SNIPPET_LANGS[1],
  );

  let code = $derived.by(() => {
    if (!selected.curlConverter) return curl;
    if (!converter) return curl;
    try {
      const convert = converter[selected.curlConverter];
      if (typeof convert !== "function") return curl;
      return convert(curl);
    } catch {
      return curl;
    }
  });

  /**
   * Highlight the snippet for its language and the current theme. Stale
   * flights are dropped so fast typing never shows an older highlight.
   */
  $effect(() => {
    const currentCode = code;
    const currentLang = selected.langCode;
    const currentTheme = runtimeTheme.resolved === "dark" ? "dark" : "light";
    let cancelled = false;
    highlightSnippet(currentCode, currentLang, currentTheme).then((html) => {
      if (!cancelled) highlighted = html;
    });
    return () => {
      cancelled = true;
    };
  });
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between gap-2">
    <Heading level="2" size="lg">Code snippets</Heading>
    {#if onClose}
      <Tooltip content="Hide code snippets" side="top">
        <Button
          size="sm"
          variant="ghost"
          square
          icon={PanelRightClose}
          aria-label="Hide code snippets"
          onclick={onClose}
        />
      </Tooltip>
    {/if}
  </div>

  <Select
    label="Language"
    items={SNIPPET_LANGS.map((lang) => ({
      value: lang.label,
      label: lang.label,
    }))}
    bind:value={store.ui.snippetLang}
  />

  {#if converterFailed}
    <p class="text-sm text-content-muted">
      Language conversion is unavailable offline. Showing curl instead.
    </p>
  {/if}

  <CodeBlock
    rawCode={code}
    highlightedHtml={highlighted}
    title={selected.label}
    fileName={`request.${selected.extension}`}
    scrollY={true}
    wrapperClass="max-h-[60dvh]"
  />
</div>
