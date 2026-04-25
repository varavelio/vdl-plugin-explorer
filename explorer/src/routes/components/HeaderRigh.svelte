<script>
  import { EllipsisVertical } from "@lucide/svelte";
  import { Button, GithubButton, Popover, ThemePicker } from "@varavel/ui";
  import { viewport } from "@varavel/ui/runtime";
  import HeaderSchemaButton from "./HeaderSchemaButton.svelte";
</script>

<div class="not-desk:hidden flex items-center gap-2">
  <HeaderSchemaButton />
  <ThemePicker />
</div>

{#if viewport.isMobile}
  <Popover size="sm">
    {#snippet trigger()}
      <Button variant="ghost" size="sm" square>
        <EllipsisVertical class="size-5" />
      </Button>
    {/snippet}

    <div class="w-full flex flex-col gap-2">
      <HeaderSchemaButton alignContent="left" />
      <ThemePicker alignContent="left" />
      <GithubButton
        user="varavelio"
        repo="vdl-plugin-explorer"
        showStars={true}
        showTag={false}
        showForks={false}
        wide={true}
      />
    </div>
  </Popover>
{/if}
