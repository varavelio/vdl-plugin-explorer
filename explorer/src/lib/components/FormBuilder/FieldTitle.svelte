<script lang="ts">
  import { Asterisk } from "@lucide/svelte";
  import { Tooltip } from "@varavel/ui";

  interface Props {
    /** Field path or name shown as label. */
    name: string;
    /** True when the field may be omitted. */
    optional: boolean;
  }

  let { name, optional }: Props = $props();
</script>

<span class="flex items-center gap-1">
  <span class="truncate text-sm font-semibold">{name}</span>
  <Tooltip
    content={optional ? "This field is optional" : "This field is required"}
  >
    {#if optional}
      <span
        class="font-mono text-sm select-none font-semibold text-purple-800 dark:text-purple-400"
      >
        ?
      </span>
    {:else}
      <Asterisk class="size-4 shrink-0 text-error" aria-label="required" />
    {/if}
  </Tooltip>
</span>
