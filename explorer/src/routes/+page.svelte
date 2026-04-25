<script lang="ts">
  import {
    BookOpenText,
    Braces,
    ListTree,
    NetworkIcon,
    Pin,
  } from "@lucide/svelte";
  import { Badge, Card, GithubButton, Heading } from "@varavel/ui";
  import { viewport } from "@varavel/ui/runtime";
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import type { Component } from "svelte";
  import { store } from "$lib/store";

  type OverviewCard = {
    title: string;
    count: number;
    description: string;
    icon: Component;
  };

  let cards = ($derived<OverviewCard[]>).by(() => {
    const cards: OverviewCard[] = [];

    if (store.ir.docs.length > 0) {
      cards.push({
        title: "Docs",
        count: store.ir.docs.length,
        description: "Documentation pages included in the schema.",
        icon: BookOpenText,
      });
    }

    if (store.ir.rpcs.length > 0) {
      cards.push({
        title: "RPCs",
        count: store.ir.rpcs.length,
        description: "RPC services grouped into procedures and streams.",
        icon: NetworkIcon,
      });
    }

    if (store.ir.types.length > 0) {
      cards.push({
        title: "Types",
        count: store.ir.types.length,
        description: "Type definitions available in the schema.",
        icon: Braces,
      });
    }

    if (store.ir.enums.length > 0) {
      cards.push({
        title: "Enums",
        count: store.ir.enums.length,
        description: "Enum definitions available in the schema.",
        icon: ListTree,
      });
    }

    if (store.ir.constants.length > 0) {
      cards.push({
        title: "Constants",
        count: store.ir.constants.length,
        description: "Constant values defined in the schema.",
        icon: Pin,
      });
    }

    return cards;
  });
</script>

<svelte:head>
  <title>VDL Explorer</title>
</svelte:head>

<section class="mx-auto w-full max-w-4xl space-y-4 p-4">
  <header class="space-y-4 p-2 text-center desk:p-4">
    <div class="space-y-4">
      <Heading level="1" size="3xl">VDL Explorer</Heading>
      <p class="mx-auto text-sm text-content-muted desk:text-base">
        Explore the VDL schema from the sidebar menu to inspect its available
        docs, RPCs, types, enums, and constants.
      </p>
    </div>

    <div class="flex flex-col items-center justify-center gap-2 desk:flex-row">
      <GithubButton
        user="varavelio"
        repo="vdl"
        size="sm"
        wide={viewport.isMobile}
        showStars={true}
        showTag={false}
        showForks={false}
      />
      <GithubButton
        user="varavelio"
        repo="vdl-plugin-explorer"
        size="sm"
        wide={viewport.isMobile}
        showStars={true}
        showTag={false}
        showForks={false}
      />
    </div>
  </header>

  <div class="grid grid-cols-1 gap-4 desk:grid-cols-2">
    {#each cards as card (card.title)}
      <Card bg="100" shadow="md">
        <div class="flex items-start justify-between gap-3">
          <Badge size="sm">{card.title}</Badge>
          <card.icon class="mt-0.5 size-5 text-content-muted" />
        </div>

        <p class="mt-6 text-4xl leading-none font-semibold tracking-tight">
          {pluralize(card.title, card.count, true)}
        </p>

        <p class="mt-4 text-sm text-content-muted">{card.description}</p>
      </Card>
    {/each}
  </div>
</section>
