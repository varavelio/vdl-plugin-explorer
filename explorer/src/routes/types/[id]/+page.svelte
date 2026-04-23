<script lang="ts">
  import { Braces } from "@lucide/svelte";
  import { Card, Heading } from "@varavel/ui";
  import AnnotationList from "$lib/components/AnnotationList.svelte";
  import EntityPage from "$lib/components/EntityPage.svelte";
  import { countLabel } from "$lib/components/ir";
  import NotFound from "$lib/components/NotFound.svelte";
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
        countLabel(typeDef.typeRef.objectFields?.length ?? 0, "field"),
      );
    }

    if (typeDef.typeRef.kind === "array") {
      nextTags.push(countLabel(typeDef.typeRef.arrayDims ?? 1, "dimension"));
    }

    if (typeDef.annotations.length > 0) {
      nextTags.push(countLabel(typeDef.annotations.length, "annotation"));
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
    kind="Type"
    title={typeDef.name}
    icon={Braces}
    {tags}
    doc={typeDef.doc}
  >
    <section class="space-y-3">
      <Heading level="2" size="lg">Definition</Heading>

      <Card bg="100" shadow="none">
        <TypeRefView typeRef={typeDef.typeRef} />
      </Card>
    </section>

    {#if typeDef.annotations.length > 0}
      <section class="space-y-3">
        <Heading level="2" size="lg">Annotations</Heading>
        <AnnotationList annotations={typeDef.annotations} />
      </section>
    {/if}
  </EntityPage>
{/if}
