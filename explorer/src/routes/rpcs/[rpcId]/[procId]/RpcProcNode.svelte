<script lang="ts">
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import { browser } from "$app/environment";
  import NodePage from "$lib/components/NodePage.svelte";
  import { buildRpcProcUrl } from "$lib/httpRpc/url";
  import type { RichIrSchemaRpcProc } from "$lib/store/ir/index";

  interface Props {
    rpcProc: RichIrSchemaRpcProc;
  }

  let { rpcProc }: Props = $props();

  const DEFAULT_RPC_BASE_URL = "https://<baseURL>";

  let tags = $derived.by(() => {
    if (!rpcProc) return [];

    const nextTags: string[] = ["procedure", rpcProc.rpcName];

    if (rpcProc.annotations.length > 0) {
      nextTags.push(pluralize("annotation", rpcProc.annotations.length, true));
    }

    return nextTags;
  });

  let rpcBaseUrl = $derived.by(() => {
    if (!browser) return DEFAULT_RPC_BASE_URL;

    const globalBaseUrl = window.__vdl_rpc_base_url?.trim();
    if (!globalBaseUrl) return DEFAULT_RPC_BASE_URL;

    return globalBaseUrl.replace(/\/+$/, "");
  });

  let rpcProcUrl = $derived.by(() => {
    if (!rpcProc) return "";
    return buildRpcProcUrl(rpcBaseUrl, rpcProc.rpcName, rpcProc.name);
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
