<script lang="ts">
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import NodePage from "$lib/components/NodePage.svelte";
  import type { RichIrSchemaHttpRpc } from "$lib/store/ir/index";

  interface Props {
    httpRpc: RichIrSchemaHttpRpc;
  }

  let { httpRpc }: Props = $props();

  let tags = $derived.by(() => {
    if (!httpRpc) return [];

    const nextTags = ["http httpRpc"];

    if (httpRpc.procs.length > 0) {
      nextTags.push(pluralize("procedure", httpRpc.procs.length, true));
    }

    return nextTags;
  });
</script>

<NodePage
  {tags}
  title={httpRpc.name}
  htmlDoc={httpRpc.htmlDoc}
  sourceCode={httpRpc.sourceCode}
/>
