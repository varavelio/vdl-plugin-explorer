<script lang="ts">
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import EntityPage from "$lib/components/EntityPage.svelte";
  import type { RichIrSchemaConstant } from "$lib/store/ir/index";

  interface Props {
    constantDef: RichIrSchemaConstant;
  }
  let { constantDef }: Props = $props();

  let tags = $derived.by(() => {
    if (!constantDef) return [];

    const nextTags: string[] = [constantDef.value.kind];

    if (constantDef.value.kind === "object") {
      nextTags.push(
        pluralize("entry", constantDef.value.objectEntries?.length ?? 0, true),
      );
    }

    if (constantDef.value.kind === "array") {
      nextTags.push(
        pluralize("item", constantDef.value.arrayItems?.length ?? 0, true),
      );
    }

    if (constantDef.annotations.length > 0) {
      nextTags.push(
        pluralize("annotation", constantDef.annotations.length, true),
      );
    }

    return nextTags;
  });
</script>

<EntityPage
  {tags}
  title={constantDef.name}
  doc={constantDef.doc}
  sourceCode={constantDef.sourceCode}
/>
