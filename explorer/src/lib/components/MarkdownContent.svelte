<script lang="ts">
  import { Prose } from "@varavel/ui";
  import DOMPurify from "dompurify";
  import { marked } from "marked";
  import type { ClassValue } from "svelte/elements";
  import { browser } from "$app/environment";

  interface Props {
    content?: string;
    compact?: boolean;
    class?: ClassValue;
  }

  let { content, compact = false, class: className }: Props = $props();

  let html = $derived.by(() => {
    if (!browser || !content) return "";
    const parsed = marked.parse(content) as string;
    return DOMPurify.sanitize(parsed);
  });

  let proseClass = $derived.by(() => {
    return [
      "max-w-none",
      compact && "[&_ol:first-child]:mt-0 [&_ol:last-child]:mb-0",
      compact && "[&_ul:first-child]:mt-0 [&_ul:last-child]:mb-0",
      compact && "[&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
      compact && "[&_pre]:my-3",
      className,
    ]
      .filter(Boolean)
      .join(" ");
  });
</script>

{#if content}
  <Prose class={proseClass} fluid>{@html html}</Prose>
{/if}
