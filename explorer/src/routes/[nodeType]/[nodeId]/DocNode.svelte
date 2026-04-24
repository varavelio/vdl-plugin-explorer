<script lang="ts">
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";
  import type { RichIrSchemaDoc } from "$lib/store/ir";

  interface Props {
    doc: RichIrSchemaDoc;
  }
  let { doc }: Props = $props();
</script>

<MarkdownContent class="p-4 pt-0" content={doc.content} />
