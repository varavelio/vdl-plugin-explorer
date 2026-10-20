<script lang="ts">
  import { CodeBlock, Heading, Select } from "@varavel/ui";
  import { onMount } from "svelte";
  import {
    buildCurl,
    type CurlConverter,
    loadCurlConverter,
    SNIPPET_LANGS,
  } from "./curl";

  interface Props {
    /** Procedure URL the snippets target. */
    endpoint: string;
    /** Current request payload rendered into the snippets. */
    input: unknown;
  }

  let { endpoint, input }: Props = $props();

  let converter: CurlConverter | null = $state(null);
  let converterFailed = $state(false);
  let selectedLabel = $state("Curl");

  let curl = $derived(buildCurl(endpoint, input));

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
</script>

<div class="space-y-4">
  <Heading level="2" size="lg">Code snippets</Heading>

  <Select
    label="Language"
    items={SNIPPET_LANGS.map((lang) => ({
      value: lang.label,
      label:
        lang.group === lang.label
          ? lang.label
          : `${lang.group} · ${lang.label}`,
    }))}
    bind:value={selectedLabel}
  />

  {#if converterFailed}
    <p class="text-sm text-content-muted">
      Language conversion is unavailable offline. Showing curl instead.
    </p>
  {/if}

  <CodeBlock
    rawCode={code}
    title={selected.label}
    fileName={`request.${selected.langCode}`}
    scrollY={true}
  />
</div>
