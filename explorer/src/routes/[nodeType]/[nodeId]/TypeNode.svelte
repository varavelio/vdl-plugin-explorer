<script lang="ts">
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import type { RichIrSchemaType } from "$lib/store/ir/index";
  import NodePage from "./NodePage.svelte";

  interface Props {
    typeDef: RichIrSchemaType;
  }
  let { typeDef }: Props = $props();

  let tags = $derived.by(() => {
    if (!typeDef) return [];

    const nextTags: string[] = [`${typeDef.typeRef.kind} type`];

    if (typeDef.typeRef.kind === "object") {
      nextTags.push(
        pluralize("field", typeDef.typeRef.objectFields?.length ?? 0, true),
      );
    }

    if (typeDef.typeRef.kind === "array") {
      nextTags.push(
        pluralize("dimension", typeDef.typeRef.arrayDims ?? 1, true),
      );
    }

    if (typeDef.annotations.length > 0) {
      nextTags.push(pluralize("annotation", typeDef.annotations.length, true));
    }

    return nextTags;
  });
</script>

<NodePage
  {tags}
  title={typeDef.name}
  htmlDoc={typeDef.htmlDoc}
  sourceCode={typeDef.sourceCode}
/>
