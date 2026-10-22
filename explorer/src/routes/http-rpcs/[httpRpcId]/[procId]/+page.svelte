<script lang="ts">
  import {
    LayoutDashboard,
    NetworkIcon,
    PanelRightOpen,
    ServerCog,
    Zap,
  } from "@lucide/svelte";
  import { Breadcrumbs, Button, Tooltip } from "@varavel/ui";
  import { viewport } from "@varavel/ui/runtime";
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
  <div class="w-full p-4 bg-base-100 gap-4 desk:sticky desk:top-0 desk:z-20">
    <div
      class={[
        "w-full",
        { "desk:pr-8": viewport.isDesktop && !store.ui.snippetsOpen },
      ]}
    >
      <Breadcrumbs
        class=""
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
    </div>

    {#if viewport.isDesktop && !store.ui.snippetsOpen}
      <div class="absolute right-2 top-2">
        <Tooltip content="Show code snippets" side="left">
          <Button
            size="sm"
            variant="ghost"
            square
            icon={PanelRightOpen}
            aria-label="Show code snippets"
            onclick={() => store.setSnippetsOpen(true)}
          />
        </Tooltip>
      </div>
    {/if}
  </div>

  <div class="p-4 pt-0">
    <HttpRpcProcNode httpRpcProc={proc} />
  </div>
{/if}
