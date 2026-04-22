<script lang="ts">
  import { Search } from "@lucide/svelte";
  import { Button, Dialog, Input, Kbd } from "@varavel/ui";

  const ctrlOrCmd = navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";
</script>

{#snippet trigger()}
  <Button icon={Search} variant="outline" class="cursor-text" wide>
    Search...
    <Kbd class="ml-2">{ctrlOrCmd}</Kbd>
    <Kbd>K</Kbd>
  </Button>
{/snippet}

<Dialog
  {trigger}
  size="sm"
  title="Search"
  description="Search for docs, types, enums, and constants."
>
  <Input placeholder="Search..." icon={Search} autofocus />
</Dialog>
