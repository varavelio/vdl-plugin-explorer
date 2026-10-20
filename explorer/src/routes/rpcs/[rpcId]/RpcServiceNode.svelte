<script lang="ts">
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import NodePage from "$lib/components/NodePage.svelte";
  import type { RichIrSchemaRpc } from "$lib/store/ir/index";

  interface Props {
    rpc: RichIrSchemaRpc;
  }

  let { rpc }: Props = $props();

  let tags = $derived.by(() => {
    if (!rpc) return [];

    const nextTags = ["rpc"];

    if (rpc.procs.length > 0) {
      nextTags.push(pluralize("procedure", rpc.procs.length, true));
    }

    return nextTags;
  });
</script>

<NodePage
  {tags}
  title={rpc.name}
  htmlDoc={rpc.htmlDoc}
  sourceCode={rpc.sourceCode}
/>
