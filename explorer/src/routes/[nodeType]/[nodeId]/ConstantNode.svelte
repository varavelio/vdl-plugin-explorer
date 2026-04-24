<script lang="ts">
  import { Card, Heading } from "@varavel/ui";
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import AnnotationList from "$lib/components/AnnotationList.svelte";
  import EntityPage from "$lib/components/EntityPage.svelte";
  import LiteralValueView from "$lib/components/LiteralValueView.svelte";
  import type { RichIrSchemaConstant } from "$lib/store/ir";

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
>
  <section class="space-y-2">
    <Heading level="2" size="lg">Value</Heading>

    <Card bg="100" shadow="none">
      <LiteralValueView value={constantDef.value} />
    </Card>
  </section>

  {#if constantDef.annotations.length > 0}
    <section class="space-y-2">
      <Heading level="2" size="lg">Annotations</Heading>
      <AnnotationList annotations={constantDef.annotations} />
    </section>
  {/if}
</EntityPage>
