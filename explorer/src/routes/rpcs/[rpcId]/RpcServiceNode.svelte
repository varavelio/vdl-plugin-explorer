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

    const procedureCount = rpc.operations.filter(
      (operation) => operation.kind === "procedure",
    ).length;
    const streamCount = rpc.operations.filter(
      (operation) => operation.kind === "stream",
    ).length;

    const nextTags = ["rpc"];

    if (procedureCount > 0) {
      nextTags.push(pluralize("procedure", procedureCount, true));
    }

    if (streamCount > 0) {
      nextTags.push(pluralize("stream", streamCount, true));
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
