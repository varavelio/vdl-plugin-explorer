<script lang="ts">
  import { Badge, CodeBlock, Heading, Prose } from "@varavel/ui";
  import { theme as runtimeTheme } from "@varavel/ui/runtime";
  import type { SourceCode } from "$lib/store/ir/index";

  interface Props {
    title: string;
    sourceCode?: SourceCode;
    inputSourceCode?: SourceCode;
    outputSourceCode?: SourceCode;
    tags?: string[];
    htmlDoc?: string;
  }

  let {
    title,
    tags = [],
    htmlDoc,
    sourceCode,
    inputSourceCode,
    outputSourceCode,
  }: Props = $props();

  function pickSourceCode(code?: SourceCode) {
    if (!code) return undefined;
    if (runtimeTheme.resolved === "dark") {
      return code.htmlDark;
    }
    return code.htmlLight;
  }

  let highlightedSourceCode = $derived(pickSourceCode(sourceCode));
  let highlightedInputSourceCode = $derived(pickSourceCode(inputSourceCode));
  let highlightedOutputSourceCode = $derived(pickSourceCode(outputSourceCode));
</script>

<div class="space-y-10.75">
  <section class="space-y-10.75">
    <div class="flex justify-between flex-wrap items-center gap-2">
      <Heading size="3xl">{title}</Heading>

      <div class="flex flex-wrap gap-2">
        {#each tags as tag}
          <Badge size="sm" variant="soft">{tag}</Badge>
        {/each}
      </div>
    </div>

    {#if htmlDoc}
      <Prose fluid>{@html htmlDoc}</Prose>
    {/if}
  </section>

  {#if sourceCode}
    <section class="space-y-6">
      <Heading level="2" size="2xl">Source</Heading>
      <CodeBlock
        rawCode={sourceCode.raw}
        highlightedHtml={highlightedSourceCode}
        title="VDL"
        fileName="source.vdl"
        bordered
      />
    </section>
  {/if}

  {#if inputSourceCode}
    <section class="space-y-6">
      <Heading level="2" size="2xl">Input</Heading>
      <CodeBlock
        rawCode={inputSourceCode.raw}
        highlightedHtml={highlightedInputSourceCode}
        title="VDL"
        fileName="input.vdl"
        bordered
      />
    </section>
  {/if}

  {#if outputSourceCode}
    <section class="space-y-6">
      <Heading level="2" size="2xl">Output</Heading>
      <CodeBlock
        rawCode={outputSourceCode.raw}
        highlightedHtml={highlightedOutputSourceCode}
        title="VDL"
        fileName="output.vdl"
        bordered
      />
    </section>
  {/if}
</div>
