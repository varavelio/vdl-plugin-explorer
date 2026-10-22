import localforage from "localforage";
import { browser } from "$app/environment";
import { SNIPPET_LANGS } from "$lib/helpers/code-snippets";
import {
  DEFAULT_HTTP_RPC_BASE_URL,
  parseHttpRpcBaseUrls,
} from "$lib/helpers/http-rpc-url";
import {
  EMPTY_RICH_IR,
  loadIrSchema,
  type RichIrSchema,
  type SourceCode,
} from "$lib/store/ir/index";

/**
 * Build a deployment-scoped IndexedDB database name, prefixing with
 * the sanitized page path so several explorers under one domain
 * (different deploy paths) keep isolated data.
 *
 * The domain root keeps the bare base name.
 *
 * @param base Base database name used at the domain root.
 * @returns The base name prefixed with the deploy path, if any.
 */
export function deploymentDbName(base: string): string {
  if (!browser) return base;
  const pathPrefix = window.location.pathname
    .replace(/(^|\/)index\.html$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return pathPrefix ? `${pathPrefix}-${base}` : base;
}

/**
 * Isolated IndexedDB database for persisted UI preferences.
 */
const settingsDb = localforage.createInstance({
  name: deploymentDbName("vdl-explorer-settings"),
  storeName: "settings",
});

/** Delay collapsing rapid edits into a single write. */
const SAVE_DELAY_MS = 300;

/** Top-level store keys persisted across visits. */
const PERSISTED_KEYS = ["settings", "ui"] as const;

/**
 * Custom header sent with procedure executions.
 */
export type HttpRpcHeader = {
  /** Stable identifier for list rendering. */
  id: string;
  /** Header name sent on the wire. */
  name: string;
  /** Header value sent on the wire. */
  value: string;
  /** Whether the header applies to executions. */
  enabled: boolean;
  /** Optional note describing the header. */
  description: string;
};

/**
 * Persisted HTTP RPC UI settings.
 */
export type HttpRpcSettingsData = {
  /** Selected base URL; validated against the configured list on read. */
  selectedBaseUrl: string;
  /** Custom headers sent with procedure executions. */
  headers: HttpRpcHeader[];
};

/**
 * Persisted explorer settings.
 */
export type StoreSettings = {
  httpRpc: HttpRpcSettingsData;
};

/**
 * Editor mode preferred for the form generator.
 */
export type FormEditorMode = "form" | "json";

/**
 * Typed UI preferences, persisted for future settings.
 */
export type StoreUi = {
  /** Editor mode every form generator opens in. */
  formEditorMode: FormEditorMode;
  /** Code snippet language selected in the playground. */
  snippetLang: string;
  /** Whether the desktop code snippets aside is visible. */
  snippetsOpen: boolean;
};

/**
 * Check for a plain JSON object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Delay a function until calls stop for the given milliseconds.
 */
function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

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
 * Normalize a persisted header, defaulting to enabled like the old
 * playground did.
 */
function normalizeHeader(value: unknown, index: number): HttpRpcHeader {
  const record = isRecord(value) ? value : {};
  return {
    id: typeof record.id === "string" ? record.id : `header-${index}`,
    name: typeof record.name === "string" ? record.name : "",
    value: typeof record.value === "string" ? record.value : "",
    enabled: typeof record.enabled === "boolean" ? record.enabled : true,
    description:
      typeof record.description === "string" ? record.description : "",
  };
}

/**
 * Normalize a persisted UI payload, whitelisting known values.
 */
function validateUi(persisted: unknown, fallback: StoreUi): StoreUi {
  const record = isRecord(persisted) ? persisted : {};
  const snippetLang =
    typeof record.snippetLang === "string" &&
    SNIPPET_LANGS.some((lang) => lang.label === record.snippetLang)
      ? record.snippetLang
      : fallback.snippetLang;
  return {
    formEditorMode:
      record.formEditorMode === "json" ? "json" : fallback.formEditorMode,
    snippetLang,
    snippetsOpen:
      typeof record.snippetsOpen === "boolean"
        ? record.snippetsOpen
        : fallback.snippetsOpen,
  };
}

/**
 * Normalize a persisted settings payload.
 */
function validateSettings(
  persisted: unknown,
  fallback: StoreSettings,
): StoreSettings {
  const record = isRecord(persisted) ? persisted : {};
  const httpRpc = isRecord(record.httpRpc) ? record.httpRpc : {};
  const headers = Array.isArray(httpRpc.headers)
    ? httpRpc.headers.map(normalizeHeader)
    : [];
  const selected =
    typeof httpRpc.selectedBaseUrl === "string" &&
    httpRpc.selectedBaseUrl.length > 0
      ? httpRpc.selectedBaseUrl
      : fallback.httpRpc.selectedBaseUrl;
  return { httpRpc: { selectedBaseUrl: selected, headers } };
}

/**
 * Persist selected top-level keys of the store, following the old playground
 * convention of saving only part of it. Nested mutations (for example through
 * `bind:value`) are detected by snapshotting and saved debounced per key, so
 * editors never call save explicitly.
 *
 * @param target Store holding the keys.
 */
function persistStoreKeys(target: Store): void {
  for (const key of PERSISTED_KEYS) {
    settingsDb
      .getItem(key)
      .then((persisted) => {
        if (persisted === null || persisted === undefined) return;
        if (key === "settings") {
          target.settings = validateSettings(persisted, target.settings);
        } else if (key === "ui") {
          target.ui = validateUi(persisted, target.ui);
        }
      })
      .catch(() => {
        // Unavailable storage keeps the initial value.
      });
  }

  $effect.root(() => {
    for (const key of PERSISTED_KEYS) {
      const saveKey = debounce((snapshot: unknown) => {
        if (snapshot === undefined) return;
        settingsDb.setItem(key, snapshot).catch(() => {
          // Private mode or quota errors keep the in-memory value.
        });
      }, SAVE_DELAY_MS);
      $effect(() => {
        const snapshot = JSON.parse(JSON.stringify(target[key])) as unknown;
        saveKey(snapshot);
      });
    }
  });
}

let headerCounter = 0;

/**
 * Store class holds all the application shared state.
 */
export class Store {
  /**
   * Flag to indicate if the store has been initialized.
   */
  initialized = $state(false);

  /**
   * The IR schema generated from the VDL source code.
   */
  ir: RichIrSchema = $state(EMPTY_RICH_IR);

  /**
   * The full source code of the IR schema in different formats (raw, HTML light, HTML dark).
   */
  irSourceCode: SourceCode = $state({
    raw: "",
    htmlLight: "",
    htmlDark: "",
  });

  /**
   * Persisted UI preferences.
   */
  settings: StoreSettings = $state({
    httpRpc: { selectedBaseUrl: readConfiguredUrls()[0], headers: [] },
  });

  /**
   * Typed persisted UI preferences.
   */
  ui: StoreUi = $state({
    formEditorMode: "form",
    snippetLang: "Curl",
    snippetsOpen: true,
  });

  /**
   * Base URLs configured through the `httpRpcBaseUrl` plugin option.
   */
  readonly httpRpcUrls = readConfiguredUrls();

  constructor() {
    if (!browser || this.initialized) return;
    persistStoreKeys(this);
    this.init();
  }

  /**
   * Initializes the store by loading the IR schema.
   */
  private async init() {
    const { richIrSchema, sourceCode } = await loadIrSchema();

    this.ir = richIrSchema;
    this.irSourceCode = sourceCode;
    this.initialized = true;
  }

  /**
   * Currently selected HTTP RPC base URL: the persisted value, whether it is
   * a configured URL or a manual override.
   */
  get selectedHttpRpcBaseUrl(): string {
    const selected = this.settings.httpRpc.selectedBaseUrl;
    return selected ? selected : this.httpRpcUrls[0];
  }

  /**
   * Select an HTTP RPC base URL, configured or custom, and persist it.
   * Blank and already-selected values are ignored so mirroring effects never
   * loop.
   *
   * @param url Base URL to select.
   */
  selectHttpRpcBaseUrl(url: string) {
    const next = url.trim().replace(/\/+$/, "");
    if (!next) return;
    if (this.settings.httpRpc.selectedBaseUrl === next) return;
    this.settings.httpRpc = {
      ...this.settings.httpRpc,
      selectedBaseUrl: next,
    };
  }

  /**
   * Persist the form generator editor mode preference.
   * Already-selected values are ignored so mirroring effects never loop.
   *
   * @param mode Editor mode to prefer.
   */
  setFormEditorMode(mode: FormEditorMode) {
    if (this.ui.formEditorMode === mode) return;
    this.ui = { ...this.ui, formEditorMode: mode };
  }

  /**
   * Show or hide the desktop code snippets aside, shared by every proc page.
   *
   * @param open Whether the aside is visible.
   */
  setSnippetsOpen(open: boolean) {
    if (this.ui.snippetsOpen === open) return;
    this.ui = { ...this.ui, snippetsOpen: open };
  }

  /**
   * Enabled custom headers with a non-blank name, applied to executions.
   */
  get enabledHttpRpcHeaders(): HttpRpcHeader[] {
    return this.settings.httpRpc.headers.filter(
      (header) => header.enabled && header.name.trim().length > 0,
    );
  }

  /**
   * Add or update a custom header matched by name, like the old playground
   * did. Names compare case-insensitively, so setting `Authorization` twice
   * updates the value instead of duplicating the row. The header ends up
   * enabled.
   *
   * @param name Header name sent on the wire.
   * @param value Header value sent on the wire.
   */
  setHttpRpcHeader(name: string, value: string) {
    const normalized = name.trim();
    if (!normalized) return;
    const target = normalized.toLowerCase();
    const existing = this.settings.httpRpc.headers.find(
      (header) => header.name.trim().toLowerCase() === target,
    );
    if (existing === undefined) {
      headerCounter += 1;
      this.settings.httpRpc = {
        ...this.settings.httpRpc,
        headers: [
          ...this.settings.httpRpc.headers,
          {
            id: `header-${Date.now()}-${headerCounter}`,
            name: normalized,
            value,
            enabled: true,
            description: "",
          },
        ],
      };
      return;
    }
    this.settings.httpRpc = {
      ...this.settings.httpRpc,
      headers: this.settings.httpRpc.headers.map((header) =>
        header === existing
          ? { ...header, name: normalized, value, enabled: true }
          : header,
      ),
    };
  }

  /** Append a blank enabled header. */
  addHttpRpcHeader() {
    headerCounter += 1;
    this.settings.httpRpc = {
      ...this.settings.httpRpc,
      headers: [
        ...this.settings.httpRpc.headers,
        {
          id: `header-${Date.now()}-${headerCounter}`,
          name: "",
          value: "",
          enabled: true,
          description: "",
        },
      ],
    };
  }

  /**
   * Remove a custom header by id.
   *
   * @param id Header identifier.
   */
  removeHttpRpcHeader(id: string) {
    this.settings.httpRpc = {
      ...this.settings.httpRpc,
      headers: this.settings.httpRpc.headers.filter(
        (header) => header.id !== id,
      ),
    };
  }
}

/**
 * Singleton instance of the Store class which holds all the application
 * shared state. This instance can be directly imported and used across
 * the application components.
 */
export const store = new Store();
