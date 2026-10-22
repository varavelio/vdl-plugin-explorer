import localforage from "localforage";
import { browser } from "$app/environment";
import { deploymentDbName } from "$lib/store";

/**
 * Single request/response pair stored in the procedure history.
 */
export type ProcHistoryItem = {
  /** Pretty-printed request payload. */
  input: string;
  /** Pretty-printed response payload. */
  output: string;
  /** ISO timestamp of the execution. */
  date: string;
  /** Procedure endpoint the request was sent to. */
  url: string;
  /** Request headers sent with the execution. */
  headers: Record<string, string>;
  /** Duration of the execution in milliseconds, if any. */
  durationMs: number | null;
};

/**
 * Persisted playground snapshot for one procedure.
 */
export type ProcPlaygroundSnapshot = {
  input: Record<string, unknown>;
  output: string;
  outputDate: string;
  /** Duration of the latest execution in milliseconds, if any. */
  durationMs: number | null;
  history: ProcHistoryItem[];
};

/**
 * Maximum history entries kept per procedure.
 */
const HISTORY_LIMIT = 150;

/** Delay collapsing rapid input edits into a single write. */
export const INPUT_SAVE_DELAY_MS = 500;

const snapshotStore = browser
  ? localforage.createInstance({
      name: deploymentDbName("vdl-explorer-http-rpc"),
      storeName: "procedures",
    })
  : null;

/**
 * Check for a plain JSON object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Normalize a persisted history entry, defaulting fields added after the
 * entry was stored.
 */
function normalizeHistoryItem(value: unknown): ProcHistoryItem {
  const record = isRecord(value) ? value : {};
  const text = (field: unknown) => (typeof field === "string" ? field : "");
  const headers: Record<string, string> = {};
  if (isRecord(record.headers)) {
    for (const [name, headerValue] of Object.entries(record.headers)) {
      if (typeof headerValue === "string") headers[name] = headerValue;
    }
  }
  return {
    input: text(record.input),
    output: text(record.output),
    date: text(record.date),
    url: text(record.url),
    headers,
    durationMs:
      typeof record.durationMs === "number" ? record.durationMs : null,
  };
}

/**
 * Format a duration for the output header.
 *
 * @param durationMs Duration in milliseconds, if any.
 * @returns Human-readable duration, or an empty string.
 */
export function formatDurationMs(durationMs: number | null): string {
  if (durationMs === null) return "";
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
}

/**
 * Reactive playground state for a single procedure.
 *
 * The input, output, execution metadata and history persist to IndexedDB
 * under a per-procedure key. Executions survive reloads. One instance is
 * created per procedure page.
 */
export class ProcPlaygroundState {
  /**
   * Current request payload bound to the form and JSON editors.
   */
  input: Record<string, unknown> = $state({});

  /**
   * Pretty-printed response of the latest execution.
   */
  output = $state("");

  /**
   * ISO timestamp of the latest execution.
   */
  outputDate = $state("");

  /**
   * Duration of the latest execution in milliseconds, if any.
   */
  durationMs: number | null = $state(null);

  /**
   * Past executions, newest first.
   */
  history: ProcHistoryItem[] = $state([]);

  #key: string;

  /**
   * @param rpcName RPC service name owning the procedure.
   * @param procName Procedure name identifying the playground.
   */
  constructor(
    readonly rpcName: string,
    readonly procName: string,
  ) {
    this.#key = `${this.rpcName}.${this.procName}`;
    if (browser) void this.restore();
  }

  /**
   * Load the persisted snapshot, if any.
   */
  async restore(): Promise<void> {
    try {
      const snapshot = await snapshotStore?.getItem<ProcPlaygroundSnapshot>(
        this.#key,
      );
      if (snapshot) {
        this.input = snapshot.input ?? {};
        this.output = snapshot.output ?? "";
        this.outputDate = snapshot.outputDate ?? "";
        this.durationMs = snapshot.durationMs ?? null;
        this.history = Array.isArray(snapshot.history)
          ? snapshot.history.map(normalizeHistoryItem)
          : [];
      }
    } catch {
      // Corrupt snapshots are ignored in favor of a blank playground.
    }
  }

  /**
   * Persist the current snapshot. Failures are ignored by design.
   */
  persistNow(): void {
    snapshotStore
      ?.setItem(this.#key, {
        input: this.input,
        output: this.output,
        outputDate: this.outputDate,
        durationMs: this.durationMs,
        history: this.history,
      } satisfies ProcPlaygroundSnapshot)
      .catch(() => {});
  }

  /**
   * Record the current input and output at the top of the history.
   *
   * @param meta Execution metadata stored with the entry.
   */
  saveCurrentToHistory(meta: {
    url: string;
    headers: Record<string, string>;
    durationMs: number | null;
  }): void {
    this.history.unshift({
      input: JSON.stringify(this.input ?? {}, null, 2),
      output: this.output,
      date: new Date().toISOString(),
      url: meta.url,
      headers: { ...meta.headers },
      durationMs: meta.durationMs,
    });

    while (this.history.length > HISTORY_LIMIT) {
      this.history.pop();
    }

    this.persistNow();
  }

  /**
   * Replace the request payload and persist the change.
   *
   * @param next Next request payload.
   */
  setInput(next: Record<string, unknown>) {
    this.input = next;
    this.persistNow();
  }

  /**
   * Replace the response payload and persist the execution metadata.
   *
   * @param next Pretty-printed response.
   * @param durationMs Duration of the execution in milliseconds, if any.
   */
  setOutput(next: string, durationMs: number | null = null) {
    this.output = next;
    this.outputDate = next ? new Date().toISOString() : "";
    this.durationMs = next ? durationMs : null;
    this.persistNow();
  }

  /**
   * Remove one history entry by index.
   *
   * @param index Position of the entry, newest first.
   */
  deleteHistoryItem(index: number) {
    if (index < 0 || index >= this.history.length) return;
    this.history.splice(index, 1);
    this.persistNow();
  }

  /**
   * Remove every history entry.
   */
  clearHistory() {
    this.history = [];
    this.persistNow();
  }

  /**
   * Reset the request payload to an empty object.
   */
  clearInput() {
    this.input = {};
    this.persistNow();
  }

  /**
   * Reset the response payload.
   */
  clearOutput() {
    this.output = "";
    this.outputDate = "";
    this.durationMs = null;
    this.persistNow();
  }
}
