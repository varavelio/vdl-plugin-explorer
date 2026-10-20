<script lang="ts">
  interface Props {
    /** Raw docstring shown below the field. */
    doc?: string;
  }

  let { doc }: Props = $props();
</script>

{#if doc}
  <p class="mt-1 text-sm text-content-muted">{doc}</p>
{/if}
