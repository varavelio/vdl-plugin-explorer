<script lang="ts">
  import { Badge, Card, Heading } from "@varavel/ui";
  import type { TypeRef } from "@varavel/vdl-plugin-sdk";
  import { pluralize } from "@varavel/vdl-plugin-sdk/utils/strings";
  import { typeRefToInlineLabel } from "$lib/helpers/ir";
  import { store } from "$lib/store";
  import AnnotationList from "./AnnotationList.svelte";
  import MarkdownContent from "./MarkdownContent.svelte";
  import TypeRefView from "./TypeRefView.svelte";

  interface Props {
    typeRef: TypeRef;
    depth?: number;
  }

  let { typeRef, depth = 0 }: Props = $props();

  /**
   * Resolves a named type to its explorer URL.
   *
   * @param name Type name to resolve.
   * @returns Explorer route hash when found.
   */
  function resolveTypeHref(name: string | undefined): string | undefined {
    if (!name) return undefined;
    return store.ir.types.find((typeDef) => typeDef.name === name)?.urlPath;
  }

  /**
   * Resolves a named enum to its explorer URL.
   *
   * @param name Enum name to resolve.
   * @returns Explorer route hash when found.
   */
  function resolveEnumHref(name: string | undefined): string | undefined {
    if (!name) return undefined;
    return store.ir.enums.find((enumDef) => enumDef.name === name)?.urlPath;
  }
</script>

{#if typeRef.kind === "primitive"}
  <div class="flex flex-wrap items-center gap-2">
    <Badge size="sm" variant="outline">Primitive</Badge>
    <code class="rounded bg-base-300 px-2 py-1 text-sm">
      {typeRef.primitiveName ?? "primitive"}
    </code>
  </div>
{:else if typeRef.kind === "type"}
  <div class="flex flex-wrap items-center gap-2">
    <Badge size="sm" variant="outline">Type</Badge>

    {#if resolveTypeHref(typeRef.typeName)}
      <a
        href={resolveTypeHref(typeRef.typeName)}
        class="text-content decoration-base-500 font-mono text-sm underline underline-offset-4 transition-colors hover:decoration-content"
      >
        {typeRef.typeName ?? "type"}
      </a>
    {:else}
      <code class="rounded bg-base-300 px-2 py-1 text-sm">
        {typeRef.typeName ?? "type"}
      </code>
    {/if}
  </div>
{:else if typeRef.kind === "enum"}
  <div class="flex flex-wrap items-center gap-2">
    <Badge size="sm" variant="outline">Enum</Badge>

    {#if resolveEnumHref(typeRef.enumName)}
      <a
        href={resolveEnumHref(typeRef.enumName)}
        class="text-content decoration-base-500 font-mono text-sm underline underline-offset-4 transition-colors hover:decoration-content"
      >
        {typeRef.enumName ?? "enum"}
      </a>
    {:else}
      <code class="rounded bg-base-300 px-2 py-1 text-sm">
        {typeRef.enumName ?? "enum"}
      </code>
    {/if}

    {#if typeRef.enumType}
      <Badge size="sm" variant="soft">{typeRef.enumType}</Badge>
    {/if}
  </div>
{:else if typeRef.kind === "array"}
  <Card bg={depth > 0 ? "100" : "200"} shadow="none" class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <Badge size="sm" variant="outline">Array</Badge>
      <span class="text-content-muted text-sm">
        {pluralize("dimension",typeRef.arrayDims ?? 1)}
      </span>
      <code class="rounded bg-base-300 px-2 py-1 text-sm">
        {typeRefToInlineLabel(typeRef)}
      </code>
    </div>

    <div class="space-y-2">
      <Heading level="3" size="sm">Element type</Heading>

      <div class="border-base-400 pl-4 border-l">
        {#if typeRef.arrayType}
          <TypeRefView typeRef={typeRef.arrayType} depth={depth + 1} />
        {:else}
          <p class="text-content-muted text-sm">
            This array does not define an element type.
          </p>
        {/if}
      </div>
    </div>
  </Card>
{:else if typeRef.kind === "map"}
  <Card bg={depth > 0 ? "100" : "200"} shadow="none" class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <Badge size="sm" variant="outline">Map</Badge>
      <code class="rounded bg-base-300 px-2 py-1 text-sm">
        {typeRefToInlineLabel(typeRef)}
      </code>
    </div>

    <div class="space-y-2">
      <Heading level="3" size="sm">Value type</Heading>

      <div class="border-base-400 pl-4 border-l">
        {#if typeRef.mapType}
          <TypeRefView typeRef={typeRef.mapType} depth={depth + 1} />
        {:else}
          <p class="text-content-muted text-sm">
            This map does not define a value type.
          </p>
        {/if}
      </div>
    </div>
  </Card>
{:else if typeRef.kind === "object"}
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <Badge size="sm" variant="outline">Object</Badge>
      <span class="text-content-muted text-sm">
        {pluralize("field",typeRef.objectFields?.length ?? 0)}
      </span>
    </div>

    {#if (typeRef.objectFields?.length ?? 0) === 0}
      <p class="text-content-muted text-sm">This object has no fields.</p>
    {:else}
      <div class="space-y-3">
        {#each typeRef.objectFields ?? [] as field (field.name)}
          <Card bg={depth > 0 ? "100" : "200"} shadow="none" class="space-y-3">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0 flex-1 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <Heading level="3" size="sm" class="font-mono">
                    {field.name}
                  </Heading>
                  <Badge
                    size="sm"
                    variant={field.optional ? "soft" : "outline"}
                  >
                    {field.optional ? "optional" : "required"}
                  </Badge>
                </div>

                {#if field.doc}
                  <MarkdownContent
                    content={field.doc}
                    compact
                    class="text-sm"
                  />
                {/if}
              </div>

              <Badge size="sm" variant="soft">{field.typeRef.kind}</Badge>
            </div>

            <div class="space-y-2">
              <Heading
                level="4"
                size="xs"
                class="text-content-muted uppercase tracking-wider"
              >
                Type
              </Heading>

              <div class="border-base-400 pl-4 border-l">
                <TypeRefView typeRef={field.typeRef} depth={depth + 1} />
              </div>
            </div>

            {#if field.annotations.length > 0}
              <div class="space-y-2">
                <Heading
                  level="4"
                  size="xs"
                  class="text-content-muted uppercase tracking-wider"
                >
                  Annotations
                </Heading>

                <AnnotationList annotations={field.annotations} compact />
              </div>
            {/if}
          </Card>
        {/each}
      </div>
    {/if}
  </div>
{/if}
