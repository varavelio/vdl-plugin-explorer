<script lang="ts">
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import NodePage from "$lib/components/NodePage.svelte";
  import type { RichIrSchemaEnum } from "$lib/store/ir/index";

  interface Props {
    enumDef: RichIrSchemaEnum;
  }
  let { enumDef }: Props = $props();

  let tags = $derived.by(() => {
    if (!enumDef) return [];

    const nextTags: string[] = [
      `${enumDef.enumType} type`,
      pluralize("member", enumDef.members.length, true),
    ];

    if (enumDef.annotations.length > 0) {
      nextTags.push(pluralize("annotation", enumDef.annotations.length, true));
    }

    return nextTags;
  });
</script>

<NodePage
  {tags}
  title={enumDef.name}
  htmlDoc={enumDef.htmlDoc}
  sourceCode={enumDef.sourceCode}
/>
