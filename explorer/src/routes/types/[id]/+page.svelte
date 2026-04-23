<script lang="ts">
  import { Braces } from "@lucide/svelte";
  import { Card, Heading } from "@varavel/ui";
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import AnnotationList from "$lib/components/AnnotationList.svelte";
  import EntityPage from "$lib/components/EntityPage.svelte";
  import NotFound from "$lib/components/NotFound.svelte";
  import SectionCard from "$lib/components/SectionCard.svelte";
  import TypeRefView from "$lib/components/TypeRefView.svelte";
  import { store } from "$lib/store";
  import type { PageProps } from "./$types";

  let { params }: PageProps = $props();

  let typeDef = $derived.by(() => {
    return store.ir.types.find((type) => type.id === params.id);
  });

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

  let pageTitle = $derived.by(() => {
    return typeDef ? `${typeDef.name} | Types` : "Not Found";
  });
</script>

<svelte:head>
  <title>{pageTitle} | VDL Explorer</title>
</svelte:head>

{#if !typeDef}
  <NotFound />
{:else}
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
{/if}
