<script lang="ts">
  import { Copy, Key, ShieldCheck, Sparkles } from "@lucide/svelte";
  import { Menu } from "@varavel/ui";
  import { discoverAuthToken } from "$lib/helpers/discover-auth-token";
  import { store } from "$lib/store";

  interface Props {
    /** Pretty-printed procedure output scanned for tokens. */
    output: string;
  }

  let { output }: Props = $props();

  /**
   * Tokens offered as shortcut chips, capped like the old playground so a
   * noisy response never overloads the toolbar.
   */
  const TOKEN_LIMIT = 5;
  let tokens = $derived(discoverAuthToken(output).slice(0, TOKEN_LIMIT));

  async function copyToken(value: string) {
    await navigator.clipboard.writeText(value);
  }

  function setAuthHeader(value: string) {
    store.setHttpRpcHeader("Authorization", `Bearer ${value}`);
  }
</script>

{#snippet copyItemIcon()}
  <Copy class="size-4" />
{/snippet}

{#snippet authItemIcon()}
  <ShieldCheck class="size-4" />
{/snippet}

{#if tokens.length > 0}
  <div class="mb-2 flex flex-wrap items-center gap-2">
    <span class="flex items-center gap-1 text-xs font-semibold">
      <Sparkles class="size-3" />
      Token detected
    </span>

    {#each tokens as token (token.path)}
      <Menu
        size="sm"
        variant="outline"
        icon={Key}
        label={token.key}
        side="top"
        items={[
          { type: "label", label: `Found at ${token.path}` },
          {
            label: "Copy token",
            icon: copyItemIcon,
            onSelect: () => void copyToken(token.value),
          },
          {
            label: "Set as Authorization header",
            icon: authItemIcon,
            onSelect: () => setAuthHeader(token.value),
          },
        ]}
      />
    {/each}
  </div>
{/if}
