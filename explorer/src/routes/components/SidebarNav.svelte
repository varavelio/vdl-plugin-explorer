<script lang="ts">
  import {
    BookOpenText,
    Braces,
    FileText,
    LayoutDashboard,
    ListTree,
    NetworkIcon,
    Pin,
    Radio,
    ServerCog,
    Zap,
  } from "@lucide/svelte";
  import { Nav } from "@varavel/ui";
  import { tick } from "svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/state";
  import { store } from "$lib/store";

  let navWrapper: HTMLElement | null = null;

  $effect(() => {
    if (!browser || !navWrapper || !page.url.hash) {
      return;
    }

    // Access length properties just to make this effect
    // reactive to changes in the IR data.
    store.ir.docs.length;
    store.ir.rpcs.length;
    store.ir.types.length;
    store.ir.enums.length;
    store.ir.constants.length;

    // Scroll the active link into view in the next microtask.
    void tick().then(() => {
      if (!navWrapper) return;
      const links = navWrapper.querySelectorAll<HTMLAnchorElement>("a[href]");
      const activeLink = Array.from(links).find(
        (link) => link.getAttribute("href") === page.url.hash,
      );

      activeLink?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  });
</script>

<div bind:this={navWrapper}>
  <Nav.Root>
    <Nav.Item
      label="Overview"
      icon={LayoutDashboard}
      href="#/"
      active={page.url.hash === "#/" || page.url.hash === ""}
    />

    {#if store.ir.docs.length > 0}
      <Nav.Group label="Docs" icon={BookOpenText} open>
        {#each store.ir.docs as doc (doc.urlPath)}
          <Nav.Item
            label={doc.title}
            href={doc.urlPath}
            active={page.url.hash === doc.urlPath}
          />
        {/each}
      </Nav.Group>
    {/if}

    {#if store.ir.rpcs.length > 0}
      <Nav.Group label="RPCs" icon={NetworkIcon} open>
        {#each store.ir.rpcs as rpc (rpc.id)}
          <Nav.Group label={rpc.name} icon={ServerCog} open>
            {#if rpc.htmlDoc}
              <Nav.Item
                label={rpc.name}
                icon={FileText}
                href={rpc.urlPath}
                active={page.url.hash === rpc.urlPath}
              />
            {/if}

            {#each rpc.operations as operation (operation.id)}
              <Nav.Item
                label={operation.name}
                icon={operation.kind === "procedure" ? Zap : Radio}
                href={operation.urlPath}
                active={page.url.hash === operation.urlPath}
              />
            {/each}
          </Nav.Group>
        {/each}
      </Nav.Group>
    {/if}

    {#if store.ir.types.length > 0}
      <Nav.Group label="Types" icon={Braces} open>
        {#each store.ir.types as type (type.urlPath)}
          <Nav.Item
            label={type.name}
            href={type.urlPath}
            active={page.url.hash === type.urlPath}
          />
        {/each}
      </Nav.Group>
    {/if}

    {#if store.ir.enums.length > 0}
      <Nav.Group label="Enums" icon={ListTree} open>
        {#each store.ir.enums as enm (enm.urlPath)}
          <Nav.Item
            label={enm.name}
            href={enm.urlPath}
            active={page.url.hash === enm.urlPath}
          />
        {/each}
      </Nav.Group>
    {/if}

    {#if store.ir.constants.length > 0}
      <Nav.Group label="Constants" icon={Pin} open>
        {#each store.ir.constants as constant (constant.urlPath)}
          <Nav.Item
            label={constant.name}
            href={constant.urlPath}
            active={page.url.hash === constant.urlPath}
          />
        {/each}
      </Nav.Group>
    {/if}
  </Nav.Root>
</div>
