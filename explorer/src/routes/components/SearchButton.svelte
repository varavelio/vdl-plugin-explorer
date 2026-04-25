<script lang="ts">
  import {
    BookOpenText,
    Braces,
    LibraryBig,
    ListTree,
    NetworkIcon,
    Pin,
    Radio,
    Search,
    Zap,
  } from "@lucide/svelte";
  import { Button, Dialog, Input, Kbd } from "@varavel/ui";
  import { browser } from "$app/environment";
  import { type SearchResult, searcher } from "$lib/search";

  /**
   * Segment used to render highlighted and non-highlighted text fragments.
   */
  type HighlightChunk = {
    text: string;
    match: boolean;
  };

  /** Stable input id used for focus management inside the dialog. */
  const uid = $props.id();

  /**
   * Platform-aware shortcut label shown next to the search trigger.
   */
  const ctrlOrCmd =
    browser && navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";

  let open = $state(false);
  let query = $state("");
  let results: SearchResult[] = $state([]);
  let activeIndex = $state(0);
  let wasOpen = false;

  /**
   * Clears query, results, and keyboard selection state.
   */
  function resetSearchState() {
    query = "";
    results = [];
    activeIndex = 0;
  }

  /**
   * Opens the command palette and focuses the query input.
   */
  function openSearch() {
    open = true;
    activeIndex = 0;

    if (browser) {
      setTimeout(() => {
        const input = document.querySelector(`#${uid}`) as HTMLInputElement;
        input?.focus();
      }, 30);
    }
  }

  /**
   * Closes the command palette and resets the local search state.
   */
  function closeSearch() {
    open = false;
    resetSearchState();
  }

  /**
   * Executes a search query and resets active selection to the first hit.
   *
   * @param text - Raw user input from the search field.
   */
  function runSearch(text: string) {
    query = text;
    results = searcher.search(text);
    activeIndex = 0;
  }

  /**
   * Returns the primary display label for a search result.
   *
   * @param result - Search hit returned by the search engine.
   * @returns The best available label in title/name/path fallback order.
   */
  function getLabel(result: SearchResult): string {
    return result.title ?? result.name ?? result.urlPath;
  }

  /**
   * Escapes regular-expression special characters in a plain string.
   *
   * @param value - Raw value that will be interpolated into a RegExp.
   * @returns Escaped string safe to use inside a regex pattern.
   */
  function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Computes normalized highlight tokens from query and engine terms.
   *
   * @param result - Search hit that contains tokenized match metadata.
   * @returns Unique terms sorted by descending length to prioritize longer matches.
   */
  function getHighlightTerms(result: SearchResult): string[] {
    const queryTerms = query
      .trim()
      .split(/\s+/)
      .map((term) => term.toLowerCase())
      .filter(Boolean);

    const resultTerms = [...result.queryTerms, ...result.terms].map((term) =>
      term.toLowerCase(),
    );

    return [...new Set([...queryTerms, ...resultTerms])].sort(
      (left, right) => right.length - left.length,
    );
  }

  /**
   * Splits text into highlighted and plain segments for rendering.
   *
   * @param text - Source text to render.
   * @param result - Search hit that provides highlight metadata.
   * @returns Ordered chunks preserving the original text sequence.
   */
  function highlightText(text: string, result: SearchResult): HighlightChunk[] {
    if (!text) return [];

    const terms = getHighlightTerms(result);
    if (!terms.length) {
      return [{ text, match: false }];
    }

    const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
    const parts = text.split(pattern).filter(Boolean);

    return parts.map((part) => ({
      text: part,
      match: terms.some((term) => part.toLowerCase() === term.toLowerCase()),
    }));
  }

  /**
   * Handles link selection from the result list.
   */
  function selectResult() {
    closeSearch();
  }

  /**
   * Handles input changes and re-runs search.
   *
   * @param event - Native input event from the search field.
   */
  function handleQueryInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    runSearch(target.value);
  }

  /**
   * Handles keyboard navigation and selection within the result list.
   *
   * @param event - Keyboard event emitted by the search input.
   */
  function handleQueryKeydown(event: KeyboardEvent) {
    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % results.length;
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + results.length) % results.length;
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      window.location.hash = results[activeIndex].urlPath;
      closeSearch();
    }
  }

  /**
   * Handles global keyboard shortcut for opening the search dialog.
   *
   * @param event - Window-level keyboard event.
   */
  function handleGlobalKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
    }
  }

  /**
   * Keeps local state in sync when the dialog closes from external interactions.
   */
  $effect(() => {
    if (wasOpen && !open) {
      resetSearchState();
    }

    wasOpen = open;
  });
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<Button
  icon={Search}
  variant="outline"
  class="cursor-text"
  alignContent="left"
  wide
  onclick={openSearch}
>
  <span class="bloc w-full flex items-center justify-between">
    <span>Search...</span>
    <span class="not-desk:hidden">
      <Kbd class="ml-2">{ctrlOrCmd}</Kbd>
      <Kbd>K</Kbd>
    </span>
  </span>
</Button>

<Dialog
  bind:open
  size="md"
  title="Search"
  description="Find docs, RPCs, types, enums, and constants instantly."
  padded={false}
>
  <div class="border-t border-base-300">
    <div class="p-4">
      <Input
        id={uid}
        value={query}
        oninput={handleQueryInput}
        onkeydown={handleQueryKeydown}
        placeholder="Search..."
        icon={Search}
        autofocus
      />
    </div>

    {#if results.length > 0}
      <div
        class="h-[400px] max-h-[80dvh] space-y-1 overflow-y-auto border-t p-2"
      >
        {#each results as result, index (result.id)}
          <a
            href={result.urlPath}
            onclick={selectResult}
            onmouseenter={() => {
              activeIndex = index;
            }}
            class={[
              "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left no-underline transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-content",
              index === activeIndex
                ? "bg-base-200"
                : "border-transparent hover:bg-base-200/70",
            ]}
          >
            <div
              class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md border"
            >
              {#if result.kind === "doc"}
                <BookOpenText class="size-4" />
              {:else if result.kind === "rpc"}
                <NetworkIcon class="size-4" />
              {:else if result.kind === "procedure"}
                <Zap class="size-4" />
              {:else if result.kind === "stream"}
                <Radio class="size-4" />
              {:else if result.kind === "type"}
                <Braces class="size-4" />
              {:else if result.kind === "enum"}
                <ListTree class="size-4" />
              {:else}
                <Pin class="size-4" />
              {/if}
            </div>

            <div class="min-w-0 flex-1 space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="truncate text-sm font-medium text-content">
                  {#each highlightText(getLabel(result), result) as part, partIndex (`label-${partIndex}-${part.text}`)}
                    {#if part.match}
                      <mark class="rounded-sm bg-yellow-300 px-0.5 text-black">
                        {part.text}
                      </mark>
                    {:else}
                      {part.text}
                    {/if}
                  {/each}
                </span>
              </div>

              <p
                class="overflow-hidden text-sm text-content-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
              >
                {#each highlightText(result.summary || result.urlPath, result) as part, partIndex (`summary-${partIndex}-${part.text}`)}
                  {#if part.match}
                    <mark class="rounded-sm bg-yellow-300 px-0.5 text-black">
                      {part.text}
                    </mark>
                  {:else}
                    {part.text}
                  {/if}
                {/each}
              </p>
            </div>
          </a>
        {/each}
      </div>
    {:else}
      <div
        class="h-[400px] max-h-[80dvh] border-t flex flex-col items-center p-4"
      >
        <LibraryBig class="size-16 text-content-muted mt-10" />
        <p class="text-content-muted text-center mt-4">
          No results. Try searching for something.
        </p>
      </div>
    {/if}
  </div>
</Dialog>
