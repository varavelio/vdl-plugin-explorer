<script lang="ts">
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import NodePage from "$lib/components/NodePage.svelte";
  import { buildHttpRpcProcUrl } from "$lib/helpers/http-rpc-url";
  import { store } from "$lib/store";
  import type { RichIrSchemaHttpRpcProc } from "$lib/store/ir/index";

  interface Props {
    httpRpcProc: RichIrSchemaHttpRpcProc;
  }

  let { httpRpcProc }: Props = $props();

  let tags = $derived.by(() => {
    if (!httpRpcProc) return [];

    const nextTags: string[] = ["procedure", httpRpcProc.httpRpcName];

    if (httpRpcProc.annotations.length > 0) {
      nextTags.push(
        pluralize("annotation", httpRpcProc.annotations.length, true),
      );
    }

    return nextTags;
  });

  let httpRpcProcUrl = $derived.by(() => {
    if (!httpRpcProc) return "";
    return buildHttpRpcProcUrl(
      store.selectedHttpRpcBaseUrl,
      httpRpcProc.httpRpcName,
      httpRpcProc.name,
    );
  });
</script>

<NodePage
  {tags}
  title={httpRpcProc.name}
  htmlDoc={httpRpcProc.htmlDoc}
  {httpRpcProcUrl}
  httpRpcInputSourceCode={httpRpcProc.inputSourceCode}
  httpRpcOutputSourceCode={httpRpcProc.outputSourceCode}
/>
