<script lang="ts">
  import "../app.css";
  import { GithubButton, ThemePicker, UiProvider } from "@varavel/ui";
  import { Loader } from "@varavel/ui/brand";
  import { AppLayout } from "@varavel/ui/layouts";
  import { viewport } from "@varavel/ui/runtime";
  import Logo from "$lib/components/Logo.svelte";
  import { store } from "$lib/store";
  import SidebarCenter from "./components/SidebarCenter.svelte";

  let { children } = $props();
</script>

{#if !store.initialized}
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
            class={{"-mr-2 [&_svg]:size-5": viewport.isMobile}}
            variant={viewport.isMobile ? "ghost" : "outline"}
            showLabel={viewport.isDesktop}
            square={viewport.isMobile}
          />
        </div>
      {/snippet}

      {#snippet sidebarCenter()}
        <SidebarCenter />
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
