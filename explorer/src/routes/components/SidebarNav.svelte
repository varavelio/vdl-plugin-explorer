<script lang="ts">
  import { BookOpenText, Braces, ListTree, Pin } from "@lucide/svelte";
  import { Nav } from "@varavel/ui";
  import { page } from "$app/state";
  import { store } from "$lib/store";
</script>

<Nav.Root>
  {#if store.ir.docs.length > 0}
    <Nav.Group label="Docs" icon={BookOpenText} open>
      {#each store.ir.docs as doc}
        <Nav.Item
          label={doc.title}
          href={doc.urlPath}
          active={page.url.hash === doc.urlPath}
        />
      {/each}
    </Nav.Group>
  {/if}

  {#if store.ir.types.length > 0}
    <Nav.Group label="Types" icon={Braces} open>
      {#each store.ir.types as type}
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
      {#each store.ir.enums as enm}
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
      {#each store.ir.constants as constant}
        <Nav.Item
          label={constant.name}
          href={constant.urlPath}
          active={page.url.hash === constant.urlPath}
        />
      {/each}
    </Nav.Group>
  {/if}
</Nav.Root>
