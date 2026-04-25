<script lang="ts">
  import { FileText, LayoutDashboard, NetworkIcon } from "@lucide/svelte";
  import { Breadcrumbs } from "@varavel/ui";
  import { tick } from "svelte";
  import { browser } from "$app/environment";
  import ErrorPage from "$lib/components/ErrorPage.svelte";
  import { store } from "$lib/store";
  import type { PageProps } from "./$types";
  import RpcServiceNode from "./RpcServiceNode.svelte";

  let { params }: PageProps = $props();

  let rpc = $derived.by(() => {
    if (!params.rpcId) return;
    return store.ir.rpcs.find((entry) => entry.id === params.rpcId);
  });

  let pageTitle = $derived.by(() => {
    if (!rpc) return "Not Found";
    return `${rpc.name} | RPCs`;
  });

  $effect(() => {
    params.rpcId;

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

{#if !rpc}
  <ErrorPage />
{/if}

{#if rpc}
  <Breadcrumbs
    class="w-full p-4 bg-base-100 desk:sticky desk:top-0 desk:z-20"
    items={[
      { label: "Overview", icon: LayoutDashboard, href: "#/" },
      { label: "RPCs", icon: NetworkIcon },
      { label: rpc.name, icon: FileText }
    ]}
  />

  <div class="p-4 pt-0"><RpcServiceNode {rpc} /></div>
{/if}
