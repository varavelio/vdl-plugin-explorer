<script lang="ts">
  import { Braces, BrushCleaning, SquarePen } from "@lucide/svelte";
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
    /**
     * External reset counter. Bumping it remounts every field from the
     * current value, used for wholesale replacements like history restore
     * that bypass the field callbacks.
     */
    resetKey?: number;
  }

  let {
    fields,
    types = [],
    enums = [],
    value = $bindable({}),
    title,
    resetKey = 0,
  }: Props = $props();

  let editorMode: "form" | "json" = $state("form");
  let jsonText = $state("");

  /**
   * Last text pushed from the value (as opposed to typed by the user).
   *
   * Plain local used to tell external value changes apart from keystrokes
   * in the same flush: when both change together the text is newer and must
   * win, otherwise the value is newer and the text is refreshed.
   */
  let pushedText = "";

  /**
   * Replace the JSON text tracking the push, so later effects know the
   * text already represents the value.
   *
   * @param next Text replacing the editor content.
   */
  function pushText(next: string) {
    jsonText = next;
    pushedText = next;
  }

  /**
   * Switch the editor mode, moving pending edits across the boundary.
   *
   * Entering JSON mode snapshots the current value into the text. Leaving
   * JSON mode commits the text back into the value so edits are never lost,
   * even if the live sync below missed an intermediate keystroke.
   *
   * @param next Editor mode to activate.
   */
  function setMode(next: "form" | "json") {
    if (next === "json") {
      pushText(JSON.stringify(value ?? {}, null, 2));
    } else if (editorMode === "json") {
      try {
        value = JSON.parse(jsonText) as Record<string, unknown>;
        pushedText = jsonText;
      } catch {
        // Invalid JSON stays in the text; the form keeps the last value.
      }
    }
    editorMode = next;
  }

  $effect(() => {
    const pretty = JSON.stringify(value ?? {}, null, 2);
    untrack(() => {
      if (jsonText === pushedText) {
        // The text is untouched since the last push, so any drift comes
        // from an external value change and the text is refreshed.
        if (jsonText !== pretty) pushText(pretty);
        return;
      }
      // The user typed since the last push. When the text already matches
      // the value there is nothing to adopt, just track the convergence.
      try {
        if (JSON.stringify(JSON.parse(jsonText)) === pretty) {
          pushedText = jsonText;
        }
      } catch {
        // Intermediate invalid JSON; leave the text alone.
      }
    });
  });

  $effect(() => {
    if (editorMode !== "json") return;
    // Read outside `untrack` so typing re-runs this effect.
    const text = jsonText;
    untrack(() => {
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        if (JSON.stringify(parsed) !== JSON.stringify(value)) {
          value = parsed;
        }
        pushedText = text;
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

  /**
   * Bumped on clear so fields remount from the emptied value instead of
   * reconciling stale drafts.
   */
  let innerRev = $state(0);

  function clearAll() {
    value = {};
    pushText("{}");
    innerRev += 1;
  }

  let resetKeySnapshot = 0;

  $effect(() => {
    const externalReset = resetKey;
    untrack(() => {
      if (externalReset !== resetKeySnapshot) {
        resetKeySnapshot = externalReset;
        pushText(JSON.stringify(value ?? {}, null, 2));
      }
    });
  });
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between gap-2">
    <div class="flex items-center gap-3">
      {#if title}
        <Heading level="2" size="lg">{title}</Heading>
      {/if}
      <div
        class="flex divide-x divide-base-400 overflow-hidden rounded-md border border-base-400"
        role="tablist"
        aria-label="Editor mode"
      >
        <Button
          size="sm"
          variant={editorMode === "form" ? "solid" : "ghost"}
          onclick={() => setMode("form")}
          icon={SquarePen}
          class="rounded-none border-0"
          role="tab"
          aria-selected={editorMode === "form"}
        >
          Form
        </Button>
        <Button
          size="sm"
          variant={editorMode === "form" ? "ghost" : "solid"}
          onclick={() => setMode("json")}
          icon={Braces}
          class="rounded-none border-0"
          role="tab"
          aria-selected={editorMode === "json"}
        >
          JSON
        </Button>
      </div>
    </div>
    <div class="flex gap-2">
      <Button size="sm" variant="ghost" icon={BrushCleaning} onclick={clearAll}>
        Clear
      </Button>
    </div>
  </div>

  {#if editorMode === "form"}
    {#key resetKey}
      {#key innerRev}
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
      {/key}
    {/key}
  {:else}
    <MonacoEditor lang="json" bind:value={jsonText} />
  {/if}
</div>
