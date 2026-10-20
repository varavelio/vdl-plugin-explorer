<script lang="ts">
  import { BrushCleaning } from "@lucide/svelte";
  import { Button, Heading } from "@varavel/ui";
  import type { EnumDef, Field, TypeDef } from "@varavel/vdl-plugin-sdk";
  import { untrack } from "svelte";
  import MonacoEditor from "$lib/components/MonacoEditor/MonacoEditor.svelte";
  import FieldNode from "./FieldNode.svelte";

  interface Props {
    /** Top-level fields rendered by the form. */
    fields: Field[];
    /** Named types used to expand `type` references. */
    types?: TypeDef[];
    /** Named enums used to render `enum` selects. */
    enums?: EnumDef[];
    /** Form result bound as JSON-serializable object. */
    value?: Record<string, unknown>;
    /** Optional heading shown above the fields. */
    title?: string;
  }

  let {
    fields,
    types = [],
    enums = [],
    value = $bindable({}),
    title,
  }: Props = $props();

  let editorMode: "form" | "json" = $state("form");
  let jsonText = $state("");

  $effect(() => {
    const pretty = JSON.stringify(value ?? {}, null, 2);
    untrack(() => {
      if (pretty !== jsonText) jsonText = pretty;
    });
  });

  $effect(() => {
    if (editorMode !== "json") return;
    const text = jsonText;
    untrack(() => {
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        if (JSON.stringify(parsed) !== JSON.stringify(value)) {
          value = parsed;
        }
      } catch {
        // The user is still typing invalid JSON; keep the text as is.
      }
    });
  });

  function updateField(name: string, next: unknown) {
    value = { ...value, [name]: next };
  }

  function removeField(name: string) {
    const next = { ...value };
    delete next[name];
    value = next;
  }

  function clearAll() {
    value = {};
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between gap-2">
    <div>
      {#if title}
        <Heading level="2" size="lg">{title}</Heading>
      {/if}
    </div>
    <div class="flex gap-2">
      <Button
        size="sm"
        variant={editorMode === "form" ? "solid" : "ghost"}
        onclick={() => (editorMode = "form")}
      >
        Form
      </Button>
      <Button
        size="sm"
        variant={editorMode === "form" ? "ghost" : "solid"}
        onclick={() => (editorMode = "json")}
      >
        JSON
      </Button>
      <Button size="sm" variant="ghost" icon={BrushCleaning} onclick={clearAll}>
        Clear
      </Button>
    </div>
  </div>

  {#if editorMode === "form"}
    {#each fields as field (field.name)}
      <FieldNode
        {field}
        {types}
        {enums}
        seen={[]}
        value={value[field.name]}
        onChange={(next) => updateField(field.name, next)}
        onRemove={() => removeField(field.name)}
      />
    {/each}

    {#if fields.length === 0}
      <p class="text-sm text-content-muted italic">
        This type defines no fields.
      </p>
    {/if}
  {:else}
    <MonacoEditor lang="json" bind:value={jsonText} />
  {/if}
</div>
