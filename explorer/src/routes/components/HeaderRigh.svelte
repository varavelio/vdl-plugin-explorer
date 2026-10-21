<script>
  import { EllipsisVertical } from "@lucide/svelte";
  import { Button, Popover, ThemePicker } from "@varavel/ui";
  import { viewport } from "@varavel/ui/runtime";
  import HeaderSchemaButton from "./HeaderSchemaButton.svelte";
  import HeaderSettingsButton from "./HeaderSettingsButton.svelte";
</script>

<div class="not-desk:hidden flex items-center gap-2">
  <HeaderSettingsButton />
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
      <HeaderSettingsButton alignContent="left" />
      <HeaderSchemaButton alignContent="left" />
      <ThemePicker alignContent="left" />
    </div>
  </Popover>
{/if}
