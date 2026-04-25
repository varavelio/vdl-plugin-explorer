<script lang="ts">
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import { browser } from "$app/environment";
  import NodePage from "$lib/components/NodePage.svelte";
  import type { RichIrSchemaRpcOperation } from "$lib/store/ir/index";

  interface Props {
    rpcOperation: RichIrSchemaRpcOperation;
  }

  let { rpcOperation }: Props = $props();

  const DEFAULT_RPC_BASE_URL = "https://<baseURL>";

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

  let rpcBaseUrl = $derived.by(() => {
    if (!browser) return DEFAULT_RPC_BASE_URL;

    const globalBaseUrl = window.__vdl_rpc_base_url?.trim();
    if (!globalBaseUrl) return DEFAULT_RPC_BASE_URL;

    return globalBaseUrl.replace(/\/+$/, "");
  });

  let rpcOperationUrl = $derived.by(() => {
    if (!rpcOperation) return "";
    return `${rpcBaseUrl}/${rpcOperation.rpcName}/${rpcOperation.name}`;
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
