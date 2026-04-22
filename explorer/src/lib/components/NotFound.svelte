<script lang="ts">
  import { Heading } from "@varavel/ui";
  import type { ClassValue, HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    class?: ClassValue;
  }

  let { class: className }: Props = $props();
</script>

<div
  class={[
    "size-full flex flex-col items-center justify-center space-y-2 text-center",
    className
  ]}
>
  <Heading size="2xl">Page Not Found</Heading>
  <p class="text-content-muted">The page you are looking for does not exist.</p>
</div>
