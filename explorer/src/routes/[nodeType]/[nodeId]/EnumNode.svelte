<script lang="ts">
  import { Card, Heading } from "@varavel/ui";
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import AnnotationList from "$lib/components/AnnotationList.svelte";
  import EntityPage from "$lib/components/EntityPage.svelte";
  import LiteralValueView from "$lib/components/LiteralValueView.svelte";
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";
  import SectionCard from "$lib/components/SectionCard.svelte";
  import type { RichIrSchemaEnum } from "$lib/store/ir";

  interface Props {
    enumDef: RichIrSchemaEnum;
  }
  let { enumDef }: Props = $props();

  let tags = $derived.by(() => {
    if (!enumDef) return [];

    const nextTags: string[] = [
      `type ${enumDef.enumType}`,
      pluralize("member", enumDef.members.length, true),
    ];

    if (enumDef.annotations.length > 0) {
      nextTags.push(pluralize("annotation", enumDef.annotations.length, true));
    }

    return nextTags;
  });
</script>

<EntityPage
  {tags}
  title={enumDef.name}
  doc={enumDef.doc}
  sourceCode={enumDef.sourceCode}
>
  <SectionCard title="Members">
    {#if enumDef.members.length === 0}
      <p class="text-content-muted text-sm">This enum has no members.</p>
    {:else}
      <div class="space-y-3">
        {#each enumDef.members as member (member.name)}
          <Card bg="100" shadow="none" class="space-y-3">
            <div class="min-w-0 flex-1 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <Heading level="3" size="sm" class="font-mono">
                  {member.name} =
                </Heading>
                <LiteralValueView value={member.value} inline />
              </div>

              {#if member.doc}
                <MarkdownContent content={member.doc} compact class="text-sm" />
              {/if}
            </div>

            {#if member.annotations.length > 0}
              <div class="space-y-2">
                <Heading
                  level="4"
                  size="xs"
                  class="text-content-muted uppercase tracking-wider"
                >
                  Annotations
                </Heading>

                <AnnotationList annotations={member.annotations} compact />
              </div>
            {/if}
          </Card>
        {/each}
      </div>
    {/if}
  </SectionCard>

  {#if enumDef.annotations.length > 0}
    <SectionCard title="Annotations">
      <AnnotationList annotations={enumDef.annotations} />
    </SectionCard>
  {/if}
</EntityPage>
