<script lang="ts">
  import { BookOpenText } from "@lucide/svelte";
  import { Breadcrumbs, Prose } from "@varavel/ui";
  import DOMPurify from "dompurify";
  import { marked } from "marked";
  import { browser } from "$app/environment";
  import NotFound from "$lib/components/NotFound.svelte";
  import { store } from "$lib/store";
  import type { PageProps } from "./$types";

  let { params }: PageProps = $props();

  let doc = $derived.by(() => {
    return store.ir.docs.find((doc) => doc.id === params.id);
  });

  let html = $derived.by(() => {
    if (!browser) return "";
    if (!doc) return "";
    const parsed = marked.parse(doc.content) as string;
    const escaped = DOMPurify.sanitize(parsed);
    return escaped;
  });

  let pageTitle = $derived.by(() => {
    return doc ? `${doc.title} | Docs` : "Not Found";
  });
</script>

<svelte:head>
  <title>{pageTitle} | VDL Explorer</title>
</svelte:head>

{#if !doc}
  <NotFound />
{/if}

{#if doc}
  <Breadcrumbs
    class="w-full p-4 bg-base-100 desk:sticky desk:top-0"
    items={[
      { label: "Docs", icon: BookOpenText },
      { label: doc.title }
    ]}
  />
  <Prose class="p-4 pt-0" fluid>{@html html}</Prose>
{/if}
