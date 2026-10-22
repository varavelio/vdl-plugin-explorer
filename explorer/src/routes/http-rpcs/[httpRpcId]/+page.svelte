<script lang="ts">
  import { LayoutDashboard, NetworkIcon, ServerCog } from "@lucide/svelte";
  import { Breadcrumbs } from "@varavel/ui";
  import { tick } from "svelte";
  import { browser } from "$app/environment";
  import ErrorPage from "$lib/components/ErrorPage.svelte";
  import { store } from "$lib/store";
  import type { PageProps } from "./$types";
  import HttpRpcServiceNode from "./HttpRpcServiceNode.svelte";

  let { params }: PageProps = $props();

  let httpRpc = $derived.by(() => {
    if (!params.httpRpcId) return;
    return store.ir.httpRpcs.find((entry) => entry.id === params.httpRpcId);
  });

  let pageTitle = $derived.by(() => {
    if (!httpRpc) return "Not Found";
    return `${httpRpc.name} | HTTP RPC`;
  });

  $effect(() => {
    params.httpRpcId;

    if (!browser) return;
    void tick().then(() => {
      const main = document.querySelector<HTMLElement>("main");
      if (!main) return;
      main.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  });
</script>

<svelte:head>
  <title>{pageTitle} | VDL Explorer</title>
</svelte:head>

{#if !httpRpc}
  <ErrorPage />
{/if}

{#if httpRpc}
  <Breadcrumbs
    class="w-full p-4 bg-base-100 desk:sticky desk:top-0 desk:z-20"
    items={[
      { label: "Overview", icon: LayoutDashboard, href: "#/" },
      { label: "HTTP RPC", icon: NetworkIcon },
      { label: httpRpc.name, icon: ServerCog },
    ]}
  />

  <div class="p-4 pt-0"><HttpRpcServiceNode {httpRpc} /></div>
{/if}
