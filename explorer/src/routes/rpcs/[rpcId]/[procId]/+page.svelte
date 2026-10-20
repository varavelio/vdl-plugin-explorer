<script lang="ts">
  import { LayoutDashboard, NetworkIcon, ServerCog, Zap } from "@lucide/svelte";
  import { Breadcrumbs } from "@varavel/ui";
  import { tick } from "svelte";
  import { browser } from "$app/environment";
  import ErrorPage from "$lib/components/ErrorPage.svelte";
  import { store } from "$lib/store";
  import type { PageProps } from "./$types";
  import RpcProcNode from "./RpcProcNode.svelte";

  let { params }: PageProps = $props();

  let rpc = $derived.by(() => {
    if (!params.rpcId) return;
    return store.ir.rpcs.find((entry) => entry.id === params.rpcId);
  });

  let proc = $derived.by(() => {
    if (!rpc || !params.procId) return;
    return rpc.procs.find((entry) => entry.id === params.procId);
  });

  let pageTitle = $derived.by(() => {
    if (!rpc || !proc) return "Not Found";
    return `${proc.name} | ${rpc.name} | RPCs`;
  });

  $effect(() => {
    params.rpcId;
    params.procId;

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

{#if !rpc || !proc}
  <ErrorPage />
{/if}

{#if rpc && proc}
  <Breadcrumbs
    class="w-full p-4 bg-base-100 desk:sticky desk:top-0 desk:z-20"
    items={[
      { label: "Overview", icon: LayoutDashboard, href: "#/" },
      { label: "RPCs", icon: NetworkIcon },
      { label: rpc.name, icon: ServerCog, href: rpc.urlPath },
      {
        label: proc.name,
        icon: Zap,
      },
    ]}
  />

  <div class="p-4 pt-0"><RpcProcNode rpcProc={proc} /></div>
{/if}
