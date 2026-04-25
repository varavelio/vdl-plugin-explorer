<script lang="ts">
  import { ScrollText } from "@lucide/svelte";
  import { Button, CodeBlock, Dialog } from "@varavel/ui";
  import { theme } from "@varavel/ui/runtime";
  import { store } from "$lib/store";

  let open = $state(false);
  const toggleOpen = () => (open = !open);

  let highlightedSourceCode = $derived.by(() => {
    if (!store.irSourceCode.raw) return "";
    if (theme.resolved === "dark") {
      return store.irSourceCode.htmlDark;
    }
    return store.irSourceCode.htmlLight;
  });
</script>

<Button icon={ScrollText} variant="outline" onclick={toggleOpen}>Schema</Button>

<Dialog
  bind:open
  title="VDL Schema"
  description="Full VDL Schema used to build this site"
>
  <CodeBlock
    rawCode={store.irSourceCode.raw}
    highlightedHtml={highlightedSourceCode}
    title="VDL"
    fileName="source.vdl"
    bordered
    scrollY
    wrapperClass="max-h-[70dvh]"
  />
</Dialog>
