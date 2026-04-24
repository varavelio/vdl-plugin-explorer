<script lang="ts">
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import EntityPage from "$lib/components/EntityPage.svelte";
  import type { RichIrSchemaEnum } from "$lib/store/ir/index";

  interface Props {
    enumDef: RichIrSchemaEnum;
  }
  let { enumDef }: Props = $props();

  let tags = $derived.by(() => {
    if (!enumDef) return [];

    const nextTags: string[] = [
      `type ${enumDef.enumType}`,
      pluralize("member", enumDef.members.length, true),
    ];

    if (enumDef.annotations.length > 0) {
      nextTags.push(pluralize("annotation", enumDef.annotations.length, true));
    }

    return nextTags;
  });
</script>

<EntityPage
  {tags}
  title={enumDef.name}
  doc={enumDef.doc}
  sourceCode={enumDef.sourceCode}
/>
