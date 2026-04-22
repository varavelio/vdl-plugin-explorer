<script lang="ts">
  import { Search } from "@lucide/svelte";
  import { Button, Kbd } from "@varavel/ui";

  const ctrlOrCmd = navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";
</script>

<Button icon={Search} variant="outline" class="cursor-text" wide>
  Search...
  <Kbd class="ml-2">{ctrlOrCmd}</Kbd>
  <Kbd>K</Kbd>
</Button>
