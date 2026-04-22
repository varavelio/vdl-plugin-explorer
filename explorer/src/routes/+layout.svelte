<script lang="ts">
  import "../app.css";
  import { ThemePicker, UiProvider } from "@varavel/ui";
  import { AppLayout } from "@varavel/ui/layouts";
  import { viewport } from "@varavel/ui/runtime";

  import Logo from "$lib/components/Logo.svelte";

  let { children } = $props();
</script>

<UiProvider>
  <AppLayout primaryRegion="sidebar" maxWidth="md">
    {#snippet sidebarTop()}
      <header class="hidden w-full desk:block">
        <a href="https://vdl.varavel.com" target="_blank">
          <Logo class="mx-auto w-27.5 desk:w-30" />
        </a>
      </header>
    {/snippet}

    {#snippet sidebarCenter()}
    <!--  -->
    {/snippet}

    {#snippet headerLeft()}
    <!--  -->
    {/snippet}

    {#snippet headerCenter()}
      <header class="w-full desk:hidden">
        <a href="https://vdl.varavel.com" target="_blank">
          <Logo class="mx-auto w-27.5 desk:w-30" />
        </a>
      </header>
    {/snippet}

    {#snippet headerRight()}
      <div>
        <ThemePicker
          class={{"-mr-2 [&_svg]:size-5": viewport.isMobile}}
          variant={viewport.isMobile ? "ghost" : "outline"}
          showLabel={viewport.isDesktop}
          square={viewport.isMobile}
        />
      </div>
    {/snippet}

    {#snippet main()}
      {@render children()}
    {/snippet}
  </AppLayout>
</UiProvider>
