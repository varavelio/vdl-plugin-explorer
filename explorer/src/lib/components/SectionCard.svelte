<script lang="ts">
  import { Card, Heading } from "@varavel/ui";
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    titleLevel?: "1" | "2" | "3" | "4" | "5" | "6";
    titleSize?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
    bg?: "100" | "200" | "300";
    children: Snippet;
  }

  let {
    title,
    titleLevel = "2",
    titleSize = "lg",
    bg = "100",
    children,
  }: Props = $props();
</script>

<section class="space-y-2">
  <Heading level={titleLevel} size={titleSize}>{title}</Heading>
  <Card {bg} shadow="none">{@render children()}</Card>
</section>
