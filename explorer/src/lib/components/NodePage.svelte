<script lang="ts">
  import { Badge, CodeBlock, Heading, Prose } from "@varavel/ui";
  import { theme as runtimeTheme } from "@varavel/ui/runtime";
  import type { SourceCode } from "$lib/store/ir/index";

  interface Props {
    title: string;
    sourceCode?: SourceCode;
    rpcInputSourceCode?: SourceCode;
    rpcOutputSourceCode?: SourceCode;
    rpcOperationUrl?: string;
    tags?: string[];
    htmlDoc?: string;
  }

  let {
    title,
    tags = [],
    htmlDoc,
    sourceCode,
    rpcInputSourceCode,
    rpcOutputSourceCode,
    rpcOperationUrl,
  }: Props = $props();

  function pickSourceCode(code?: SourceCode) {
    if (!code) return undefined;
    if (runtimeTheme.resolved === "dark") {
      return code.htmlDark;
    }
    return code.htmlLight;
  }

  let hlSourceCode = $derived(pickSourceCode(sourceCode));
  let hlRpcInputSourceCode = $derived(pickSourceCode(rpcInputSourceCode));
  let hlRpcOutputSourceCode = $derived(pickSourceCode(rpcOutputSourceCode));
</script>

<div class="space-y-10.75">
  <section class="space-y-10.75">
    <div class="space-y-6">
      <div class="flex justify-between flex-wrap items-center gap-2">
        <Heading size="3xl">{title}</Heading>

        <div class="flex flex-wrap gap-2">
          {#each tags as tag (tag)}
            <Badge size="sm" variant="soft">{tag}</Badge>
          {/each}
        </div>
      </div>

      {#if rpcOperationUrl}
        <CodeBlock
          rawCode={rpcOperationUrl}
          title="Endpoint"
          showDownload={false}
          bordered
        />
      {/if}
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
        highlightedHtml={hlSourceCode}
        title="VDL"
        fileName="source.vdl"
        bordered
      />
    </section>
  {/if}

  {#if rpcInputSourceCode}
    <section class="space-y-6">
      <Heading level="2" size="2xl">Input</Heading>
      <CodeBlock
        rawCode={rpcInputSourceCode.raw}
        highlightedHtml={hlRpcInputSourceCode}
        title="VDL"
        fileName="input.vdl"
        bordered
      />
    </section>
  {/if}

  {#if rpcOutputSourceCode}
    <section class="space-y-6">
      <Heading level="2" size="2xl">Output</Heading>
      <CodeBlock
        rawCode={rpcOutputSourceCode.raw}
        highlightedHtml={hlRpcOutputSourceCode}
        title="VDL"
        fileName="output.vdl"
        bordered
      />
    </section>
  {/if}
</div>
