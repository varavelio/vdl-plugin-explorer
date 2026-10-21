import { browser } from "$app/environment";
import { DEFAULT_HTTP_RPC_BASE_URL, parseHttpRpcBaseUrls } from "./url";

/**
 * Local storage key for the selected HTTP RPC base URL.
 */
const STORAGE_KEY = "vdl-explorer-http-rpc-base-url";

/**
 * Read the base URLs configured through the `httpRpcBaseUrl` plugin option.
 *
 * @returns The configured URLs, or the fallback when none is configured.
 */
function readConfiguredUrls(): string[] {
  if (!browser) return [DEFAULT_HTTP_RPC_BASE_URL];
  return parseHttpRpcBaseUrls(window.__vdl_http_rpc_base_url);
}

/**
 * Restore the persisted selection when it still belongs to the list.
 *
 * @param urls Configured base URLs.
 * @returns The stored URL, or the first configured one.
 */
function readStoredSelection(urls: string[]): string {
  if (browser) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)?.trim();
      if (stored && urls.includes(stored)) return stored;
    } catch {
      // Storage is unavailable (private mode); fall through to the default.
    }
  }
  return urls[0];
}

const initialUrls = readConfiguredUrls();

/**
 * HTTP RPC base URL selected in the settings dialog.
 *
 * The selection drives procedure URLs, code snippets and executions, and is
 * persisted across visits.
 */
class HttpRpcBaseUrlSettings {
  /** Base URLs configured through the `httpRpcBaseUrl` plugin option. */
  urls = $state(initialUrls);

  /** Currently selected base URL. */
  selected = $state(readStoredSelection(initialUrls));

  /**
   * Select a configured base URL and persist the choice.
   *
   * @param url Base URL to select; unknown values are ignored.
   */
  select(url: string) {
    if (!this.urls.includes(url)) return;
    this.selected = url;
    if (!browser) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, url);
    } catch {
      // Storage is unavailable (private mode); the selection still applies.
    }
  }
}

/**
 * Shared HTTP RPC base URL settings.
 */
export const httpRpcBaseUrl = new HttpRpcBaseUrlSettings();
