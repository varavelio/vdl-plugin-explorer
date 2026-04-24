<script lang="ts">
  import { Prose } from "@varavel/ui";
  import type { RichIrSchemaDoc } from "$lib/store/ir/index";

  interface Props {
    doc: RichIrSchemaDoc;
  }
  let { doc }: Props = $props();
</script>

<Prose fluid class="p-4 pt-0">{@html doc.sourceCode.htmlLight}</Prose>
