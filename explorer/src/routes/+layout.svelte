<script lang="ts">
  import "../app.css";
  import { GithubButton, ThemePicker, UiProvider } from "@varavel/ui";
  import { Loader } from "@varavel/ui/brand";
  import { AppLayout } from "@varavel/ui/layouts";
  import { viewport } from "@varavel/ui/runtime";
  import Logo from "$lib/components/Logo.svelte";
  import { highlighter } from "$lib/shiki";
  import { store } from "$lib/store";
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
    <AppLayout
      primaryRegion="header"
      maxWidth="md"
      showSidebarBottom={viewport.isMobile}
    >
      {#snippet headerLeft()}
        <header class="hidden desk:block ml-2">
          <a href="#/"><Logo class="h-8" /></a>
        </header>
      {/snippet}

      {#snippet headerCenter()}
        <header class="w-full desk:hidden">
          <a href="#/"><Logo class="mx-auto h-8" /></a>
        </header>
      {/snippet}

      {#snippet headerRight()}
        <div class="flex items-center gap-2">
          {#if viewport.isDesktop}
            <GithubButton
              user="varavelio"
              repo="vdl-plugin-explorer"
              showStars={true}
              showTag={false}
              showForks={false}
            />
          {/if}

          <ThemePicker
            class={{"[&_svg]:size-5": viewport.isMobile}}
            variant={viewport.isMobile ? "ghost" : "outline"}
            showLabel={viewport.isDesktop}
            square={viewport.isMobile}
          />
        </div>
      {/snippet}

      {#snippet sidebarTop()}
        <div class="pr-10 desk:pr-0"><SearchButton /></div>
      {/snippet}

      {#snippet sidebarCenter()}
        <SidebarNav />
      {/snippet}

      {#snippet sidebarBottom()}
        <div class="w-full space-y-2">
          <GithubButton
            user="varavelio"
            repo="vdl-plugin-explorer"
            size="sm"
            showStars={true}
            showTag={false}
            showForks={false}
            wide={true}
          />
        </div>
      {/snippet}

      {#snippet main()}
        {@render children()}
      {/snippet}
    </AppLayout>
  </UiProvider>
{/if}
