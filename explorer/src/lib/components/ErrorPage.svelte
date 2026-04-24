<script lang="ts">
  import { Heading } from "@varavel/ui";
  import type { ClassValue, HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    class?: ClassValue;
    title?: string;
    message?: string;
  }

  let {
    class: className,
    title = "Page Not Found",
    message = "The page you are looking for does not exist.",
  }: Props = $props();
</script>

<div
  class={[
    "size-full flex flex-col items-center justify-center space-y-2 text-center",
    className
  ]}
>
  <Heading size="2xl">{title}</Heading>
  <p class="text-content-muted">{message}</p>
</div>
