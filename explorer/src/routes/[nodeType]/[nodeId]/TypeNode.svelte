<script lang="ts">
  import { Braces } from "@lucide/svelte";
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import AnnotationList from "$lib/components/AnnotationList.svelte";
  import EntityPage from "$lib/components/EntityPage.svelte";
  import SectionCard from "$lib/components/SectionCard.svelte";
  import TypeRefView from "$lib/components/TypeRefView.svelte";
  import type { RichIrSchemaType } from "$lib/store/ir";

  interface Props {
    typeDef: RichIrSchemaType;
  }
  let { typeDef }: Props = $props();

  let tags = $derived.by(() => {
    if (!typeDef) return [];

    const nextTags: string[] = [typeDef.typeRef.kind];

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

<EntityPage
  section="Types"
  title={typeDef.name}
  icon={Braces}
  {tags}
  doc={typeDef.doc}
>
  <SectionCard title="Definition">
    <TypeRefView typeRef={typeDef.typeRef} />
  </SectionCard>

  {#if typeDef.annotations.length > 0}
    <SectionCard title="Annotations">
      <AnnotationList annotations={typeDef.annotations} />
    </SectionCard>
  {/if}
</EntityPage>
