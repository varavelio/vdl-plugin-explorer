<script lang="ts">
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import NodePage from "$lib/components/NodePage.svelte";
  import type { RichIrSchemaRpcOperation } from "$lib/store/ir/index";

  interface Props {
    rpcOperation: RichIrSchemaRpcOperation;
  }

  let { rpcOperation }: Props = $props();

  let tags = $derived.by(() => {
    if (!rpcOperation) return [];

    const nextTags: string[] = [rpcOperation.kind, rpcOperation.rpcName];

    if (rpcOperation.annotations.length > 0) {
      nextTags.push(
        pluralize("annotation", rpcOperation.annotations.length, true),
      );
    }

    return nextTags;
  });

  let rpcOperationUrl = $derived.by(() => {
    if (!rpcOperation) return "";
    return `https://<baseURL>/${rpcOperation.rpcName}/${rpcOperation.name}`;
  });
</script>

<NodePage
  {tags}
  title={rpcOperation.name}
  htmlDoc={rpcOperation.htmlDoc}
  {rpcOperationUrl}
  rpcInputSourceCode={rpcOperation.inputSourceCode}
  rpcOutputSourceCode={rpcOperation.outputSourceCode}
/>
