<script lang="ts">
  import { Copy, Key, ShieldCheck, Sparkles } from "@lucide/svelte";
  import { Menu } from "@varavel/ui";
  import { clipboard } from "@varavel/ui/runtime";
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
    await clipboard.copy(value);
  }

  function setAuthHeader(value: string, withBearer: boolean) {
    store.setHttpRpcHeader(
      "Authorization",
      withBearer ? `Bearer ${value}` : value,
    );
  }
</script>

{#snippet copyItemIcon()}
  <Copy class="size-4" />
{/snippet}

{#snippet authItemIcon()}
  <ShieldCheck class="size-4" />
{/snippet}

{#if tokens.length > 0}
  <div
    class="mt-4 flex items-center justify-between gap-3 border-t border-base-300 pt-4"
  >
    <span class="flex shrink-0 items-center gap-1 text-xs font-semibold">
      <Sparkles class="size-3" />
      Token detected
    </span>

    <div class="min-w-0 flex-1 overflow-x-auto">
      <div class="flex w-max min-w-full items-center justify-end gap-1">
        {#each tokens as token (token.path)}
          {#snippet bearerLabel()}
            <span class="flex-1">
              Set as header
              <code class="rounded bg-base-300 px-1 py-px font-mono text-xs">
                Authorization: Bearer &lt;token&gt;
              </code>
            </span>
          {/snippet}

          {#snippet rawLabel()}
            <span class="flex-1">
              Set as header
              <code class="rounded bg-base-300 px-1 py-px font-mono text-xs">
                Authorization: &lt;token&gt;
              </code>
            </span>
          {/snippet}

          <Menu
            size="sm"
            variant="ghost"
            triggerClass="shrink-0 font-normal"
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
                label: bearerLabel,
                icon: authItemIcon,
                onSelect: () => setAuthHeader(token.value, true),
              },
              {
                label: rawLabel,
                icon: authItemIcon,
                onSelect: () => setAuthHeader(token.value, false),
              },
            ]}
          />
        {/each}
      </div>
    </div>
  </div>
{/if}
