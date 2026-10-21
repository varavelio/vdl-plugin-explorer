<script lang="ts">
  import { CodeBlock, Heading, Label } from "@varavel/ui";
  import { theme as runtimeTheme } from "@varavel/ui/runtime";
  import { onMount } from "svelte";
  import { highlightSnippet } from "$lib/shiki/shiki.svelte";
  import {
    buildCurl,
    type CurlConverter,
    loadCurlConverter,
    SNIPPET_LANGS,
    type SnippetLang,
  } from "./curl";

  interface Props {
    /** Procedure URL the snippets target. */
    endpoint: string;
    /** Current request payload rendered into the snippets. */
    input: unknown;
    /** Extra headers merged over the JSON defaults. */
    headers?: Record<string, string>;
  }

  let { endpoint, input, headers = {} }: Props = $props();

  let converter: CurlConverter | null = $state(null);
  let converterFailed = $state(false);
  let selectedLabel = $state("Curl");
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
    SNIPPET_LANGS.find((lang) => lang.label === selectedLabel) ??
      SNIPPET_LANGS[1],
  );

  /**
   * Picker entries in declaration order: families with a single language
   * render as top-level options, larger families as native optgroups.
   */
  type PickerEntry =
    | { kind: "option"; lang: SnippetLang }
    | { kind: "group"; name: string; langs: SnippetLang[] };

  let pickerEntries = $derived.by((): PickerEntry[] => {
    const counts = new Map<string, number>();
    for (const lang of SNIPPET_LANGS) {
      counts.set(lang.group, (counts.get(lang.group) ?? 0) + 1);
    }
    const entries: PickerEntry[] = [];
    const grouped = new Set<string>();
    for (const lang of SNIPPET_LANGS) {
      if ((counts.get(lang.group) ?? 0) > 1) {
        if (grouped.has(lang.group)) continue;
        grouped.add(lang.group);
        entries.push({
          kind: "group",
          name: lang.group,
          langs: SNIPPET_LANGS.filter((other) => other.group === lang.group),
        });
      } else {
        entries.push({ kind: "option", lang });
      }
    }
    return entries;
  });

  /**
   * Short option text without the redundant group prefix, which the
   * optgroup already shows ("JavaScript Fetch" renders as "Fetch").
   */
  function shortLabel(lang: SnippetLang): string {
    const prefix = `${lang.group} `;
    return lang.label.startsWith(prefix)
      ? lang.label.slice(prefix.length)
      : lang.label;
  }

  let code = $derived.by(() => {
    if (!selected.converter) return curl;
    if (!converter) return curl;
    try {
      const convert = converter[selected.converter];
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
  <Heading level="2" size="lg">Code snippets</Heading>

  <div>
    <Label for="snippet-language">Language</Label>
    <select
      id="snippet-language"
      bind:value={selectedLabel}
      class="text-content mt-1 inline-flex h-10 w-full cursor-pointer items-center gap-3 rounded-md border border-base-400 bg-base-100 px-3 text-sm transition-colors duration-200 hover:border-content hover:bg-base-100 focus:border-content focus:outline-none focus-visible:border-content focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-content"
    >
      {#each pickerEntries as entry (entry.kind === "group"
        ? entry.name
        : entry.lang.label)}
        {#if entry.kind === "group"}
          <optgroup label={entry.name}>
            {#each entry.langs as lang (lang.label)}
              <option value={lang.label}>{shortLabel(lang)}</option>
            {/each}
          </optgroup>
        {:else}
          <option value={entry.lang.label}>{entry.lang.label}</option>
        {/if}
      {/each}
    </select>
  </div>

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
  />
</div>
