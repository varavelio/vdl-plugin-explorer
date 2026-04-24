<script lang="ts">
  import { BookOpenText, Braces, ListTree, Pin } from "@lucide/svelte";
  import { Breadcrumbs } from "@varavel/ui";
  import NotFound from "$lib/components/NotFound.svelte";
  import { store } from "$lib/store";
  import type { RichIrSchemaNode } from "$lib/store/ir";
  import type { LayoutProps } from "./$types";

  let { children, params }: LayoutProps = $props();

  let node = $derived.by(() => {
    if (!params.nodeType || !params.nodeId) return;

    let nodes: RichIrSchemaNode[] = [];
    if (params.nodeType === "docs") nodes = store.ir.docs;
    if (params.nodeType === "types") nodes = store.ir.types;
    if (params.nodeType === "enums") nodes = store.ir.enums;
    if (params.nodeType === "constants") nodes = store.ir.constants;

    return nodes.find((node) => node.id === params.nodeId);
  });

  let title = $derived.by(() => {
    if (!node) return "";

    // Discriminate node type by presence of unique properties.
    if ("content" in node) return node.title; // Doc
    if ("typeRef" in node) return node.name; // Type
    if ("members" in node) return node.name; // Enum
    if ("value" in node) return node.name; // Constant

    return "";
  });

  let nodeGroupType = $derived.by(() => {
    if (!node) return "";

    // Discriminate node type by presence of unique properties.
    if ("content" in node) return "Docs";
    if ("typeRef" in node) return "Types";
    if ("members" in node) return "Enums";
    if ("value" in node) return "Constants";

    return "";
  });

  let nodeGroupIcon = $derived.by(() => {
    if (nodeGroupType === "Docs") return BookOpenText;
    if (nodeGroupType === "Types") return Braces;
    if (nodeGroupType === "Enums") return ListTree;
    if (nodeGroupType === "Constants") return Pin;

    return BookOpenText;
  });

  let pageTitle = $derived.by(() => {
    if (!node) return "Not Found";
    return `${title} | ${nodeGroupType}`;
  });
</script>

<svelte:head>
  <title>{pageTitle} | VDL Explorer</title>
</svelte:head>

{#if !node}
  <NotFound />
{/if}

{#if node}
  <Breadcrumbs
    class="w-full p-4 bg-base-100 desk:sticky desk:top-0"
    items={[
      { label: nodeGroupType, icon: nodeGroupIcon },
      { label: title }
    ]}
  />

  {#if children}
    <div class="p-4 pt-0">{@render children()}</div>
  {/if}
{/if}
