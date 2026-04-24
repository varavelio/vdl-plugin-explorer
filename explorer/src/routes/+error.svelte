<script lang="ts">
  import { page } from "$app/state";
  import ErrorPage from "$lib/components/ErrorPage.svelte";
</script>

{#if page.status === 404}
  <ErrorPage />
{:else}
  <ErrorPage
    title={`${page.status} Error`}
    message={page.error?.message?? "Something went wrong."}
  />
{/if}
