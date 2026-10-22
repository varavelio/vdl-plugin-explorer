<script lang="ts">
  import { LayoutDashboard, NetworkIcon, ServerCog, Zap } from "@lucide/svelte";
  import { Breadcrumbs } from "@varavel/ui";
  import { tick } from "svelte";
  import { browser } from "$app/environment";
  import ErrorPage from "$lib/components/ErrorPage.svelte";
  import { store } from "$lib/store";
  import type { PageProps } from "./$types";
  import HttpRpcProcNode from "./HttpRpcProcNode.svelte";

  let { params }: PageProps = $props();

  let httpRpc = $derived.by(() => {
    if (!params.httpRpcId) return;
    return store.ir.httpRpcs.find((entry) => entry.id === params.httpRpcId);
  });

  let proc = $derived.by(() => {
    if (!httpRpc || !params.procId) return;
    return httpRpc.procs.find((entry) => entry.id === params.procId);
  });

  let pageTitle = $derived.by(() => {
    if (!httpRpc || !proc) return "Not Found";
    return `${proc.name} | ${httpRpc.name} | HTTP RPC`;
  });

  $effect(() => {
    params.httpRpcId;
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

{#if !httpRpc || !proc}
  <ErrorPage />
{/if}

{#if httpRpc && proc}
  <Breadcrumbs
    class="w-full p-4 bg-base-100 desk:sticky desk:top-0 desk:z-20"
    items={[
      { label: "Overview", icon: LayoutDashboard, href: "#/" },
      { label: "HTTP RPC", icon: NetworkIcon },
      { label: httpRpc.name, icon: ServerCog, href: httpRpc.urlPath },
      {
        label: proc.name,
        icon: Zap,
      },
    ]}
  />

  <div class="p-4 pt-0">
    <HttpRpcProcNode httpRpcProc={proc} />
  </div>
{/if}
