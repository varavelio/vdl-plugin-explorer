<script lang="ts">
  import { Card, Heading } from "@varavel/ui";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  interface Props {
    title: string;
    titleLevel?: "1" | "2" | "3" | "4" | "5" | "6";
    titleSize?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
    bg?: "100" | "200" | "300";
    sectionClass?: ClassValue;
    headingClass?: ClassValue;
    cardClass?: ClassValue;
    children: Snippet;
  }

  let {
    title,
    titleLevel = "2",
    titleSize = "lg",
    bg = "100",
    sectionClass,
    headingClass,
    cardClass,
    children,
  }: Props = $props();
</script>

<section class={["space-y-2", sectionClass]}>
  <Heading level={titleLevel} size={titleSize} class={headingClass}>
    {title}
  </Heading>
  <Card {bg} shadow="none" class={cardClass}>{@render children()}</Card>
</section>
