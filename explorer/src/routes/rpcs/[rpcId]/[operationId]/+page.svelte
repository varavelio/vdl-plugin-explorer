<script lang="ts">
  import {
    LayoutDashboard,
    NetworkIcon,
    Radio,
    ServerCog,
    Zap,
  } from "@lucide/svelte";
  import { Breadcrumbs } from "@varavel/ui";
  import { tick } from "svelte";
  import { browser } from "$app/environment";
  import ErrorPage from "$lib/components/ErrorPage.svelte";
  import { store } from "$lib/store";
  import type { PageProps } from "./$types";
  import RpcOperationNode from "./RpcOperationNode.svelte";

  let { params }: PageProps = $props();

  let rpc = $derived.by(() => {
    if (!params.rpcId) return;
    return store.ir.rpcs.find((entry) => entry.id === params.rpcId);
  });

  let operation = $derived.by(() => {
    if (!rpc || !params.operationId) return;
    return rpc.operations.find((entry) => entry.id === params.operationId);
  });

  let pageTitle = $derived.by(() => {
    if (!rpc || !operation) return "Not Found";
    return `${operation.name} | ${rpc.name} | RPCs`;
  });

  $effect(() => {
    params.rpcId;
    params.operationId;

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

{#if !rpc || !operation}
  <ErrorPage />
{/if}

{#if rpc && operation}
  <Breadcrumbs
    class="w-full p-4 bg-base-100 desk:sticky desk:top-0 desk:z-20"
    items={[
      { label: "Overview", icon: LayoutDashboard, href: "#/" },
      { label: "RPCs", icon: NetworkIcon },
      { label: rpc.name, icon: ServerCog, href: rpc.urlPath },
      { label: operation.name, icon: operation.kind === "procedure" ? Zap : Radio}
    ]}
  />

  <div class="p-4 pt-0"><RpcOperationNode rpcOperation={operation} /></div>
{/if}
