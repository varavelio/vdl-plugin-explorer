// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  interface Window {
    /**
     * This variable is replaced by the plugin at build time to inject
     * the base URL for the HTTP RPC calls to the VDL plugin.
     */
    __vdl_http_rpc_base_url?: string;
  }

  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
