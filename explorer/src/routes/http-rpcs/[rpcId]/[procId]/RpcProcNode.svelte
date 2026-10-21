<script lang="ts">
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import NodePage from "$lib/components/NodePage.svelte";
  import { buildRpcProcUrl } from "$lib/httpRpc/url";
  import { store } from "$lib/store";
  import type { RichIrSchemaRpcProc } from "$lib/store/ir/index";

  interface Props {
    rpcProc: RichIrSchemaRpcProc;
  }

  let { rpcProc }: Props = $props();

  let tags = $derived.by(() => {
    if (!rpcProc) return [];

    const nextTags: string[] = ["procedure", rpcProc.rpcName];

    if (rpcProc.annotations.length > 0) {
      nextTags.push(pluralize("annotation", rpcProc.annotations.length, true));
    }

    return nextTags;
  });

  let rpcProcUrl = $derived.by(() => {
    if (!rpcProc) return "";
    return buildRpcProcUrl(
      store.selectedHttpRpcBaseUrl,
      rpcProc.rpcName,
      rpcProc.name,
    );
  });
</script>

<NodePage
  {tags}
  title={rpcProc.name}
  htmlDoc={rpcProc.htmlDoc}
  {rpcProcUrl}
  rpcInputSourceCode={rpcProc.inputSourceCode}
  rpcOutputSourceCode={rpcProc.outputSourceCode}
/>
