<script lang="ts">
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import type { RichIrSchemaEnum } from "$lib/store/ir/index";
  import NodePage from "./NodePage.svelte";

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

<NodePage
  {tags}
  title={enumDef.name}
  htmlDoc={enumDef.htmlDoc}
  sourceCode={enumDef.sourceCode}
/>
