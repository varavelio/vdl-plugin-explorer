<script lang="ts">
  import "../app.css";
  import { GithubButton, UiProvider } from "@varavel/ui";
  import { Loader } from "@varavel/ui/brand";
  import { AppLayout } from "@varavel/ui/layouts";
  import { viewport } from "@varavel/ui/runtime";
  import Logo from "$lib/components/Logo.svelte";
  import { highlighter } from "$lib/shiki";
  import { store } from "$lib/store";
  import HeaderRigh from "./components/HeaderRigh.svelte";
  import SearchButton from "./components/SearchButton.svelte";
  import SidebarNav from "./components/SidebarNav.svelte";

  let { children } = $props();

  let initialized = $derived(store.initialized && highlighter.initialized);
</script>

{#if !initialized}
  <div class="w-dvw h-dvh overflow-hidden flex items-center justify-center">
    <Loader size="lg" />
  </div>
{:else}
  <UiProvider>
    <AppLayout primaryRegion="header" maxWidth="md" sidebarWidth="lg">
      {#snippet headerLeft()}
        <header class="hidden desk:flex ml-2 items-center gap-4">
          <a href="#/"><Logo class="h-8" /></a>
          {#if viewport.isDesktop}
            <GithubButton
              user="varavelio"
              repo="vdl-plugin-explorer"
              showStars={true}
              showTag={false}
              showForks={false}
            />
          {/if}
        </header>
      {/snippet}

      {#snippet headerCenter()}
        <header class="w-full desk:hidden">
          <a href="#/"><Logo class="mx-auto h-8" /></a>
        </header>
      {/snippet}

      {#snippet headerRight()}
        <HeaderRigh />
      {/snippet}

      {#snippet sidebarTop()}
        <div class="pr-10 desk:pr-0"><SearchButton /></div>
      {/snippet}

      {#snippet sidebarCenter()}
        <SidebarNav />
      {/snippet}

      {#snippet main()}
        {@render children()}
      {/snippet}
    </AppLayout>
  </UiProvider>
{/if}
