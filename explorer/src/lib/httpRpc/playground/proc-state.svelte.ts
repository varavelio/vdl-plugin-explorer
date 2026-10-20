import localforage from "localforage";
import { browser } from "$app/environment";

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
};

/**
 * Persisted playground snapshot for one procedure.
 */
type ProcPlaygroundSnapshot = {
  input: Record<string, unknown>;
  output: string;
  outputDate: string;
  history: ProcHistoryItem[];
};

/**
 * Maximum history entries kept per procedure.
 */
const HISTORY_LIMIT = 150;

const STORAGE_PREFIX = "proc-playground:";

const snapshotStore = browser
  ? localforage.createInstance({
      name: "vdl-explorer-playground",
      storeName: "procedures",
    })
  : null;

/**
 * Reactive playground state for a single procedure.
 *
 * The input, output, and history are persisted to IndexedDB so executions
 * survive reloads. One instance is created per procedure page.
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
   * Past executions, newest first.
   */
  history: ProcHistoryItem[] = $state([]);

  /**
   * True once the persisted snapshot has been restored.
   */
  ready = $state(false);

  #key: string;

  /**
   * @param rpcName RPC service name owning the procedure.
   * @param procName Procedure name identifying the playground.
   */
  constructor(
    readonly rpcName: string,
    readonly procName: string,
  ) {
    this.#key = `${STORAGE_PREFIX}${rpcName}.${procName}`;
    if (browser) void this.restore();
    else this.ready = true;
  }

  /**
   * Restore the persisted snapshot when one exists.
   */
  private async restore(): Promise<void> {
    try {
      const snapshot = await snapshotStore?.getItem<ProcPlaygroundSnapshot>(
        this.#key,
      );
      if (snapshot) {
        this.input = snapshot.input ?? {};
        this.output = snapshot.output ?? "";
        this.outputDate = snapshot.outputDate ?? "";
        this.history = snapshot.history ?? [];
      }
    } catch {
      // Corrupt snapshots are ignored in favor of a blank playground.
    } finally {
      this.ready = true;
    }
  }

  /**
   * Persist the current snapshot. Failures are ignored by design.
   */
  private persist(): void {
    snapshotStore
      ?.setItem(this.#key, {
        input: this.input,
        output: this.output,
        outputDate: this.outputDate,
        history: this.history,
      } satisfies ProcPlaygroundSnapshot)
      .catch(() => {});
  }

  /**
   * Record the current input and output at the top of the history.
   */
  saveCurrentToHistory(): void {
    this.history.unshift({
      input: JSON.stringify(this.input ?? {}, null, 2),
      output: this.output,
      date: new Date().toISOString(),
    });

    while (this.history.length > HISTORY_LIMIT) {
      this.history.pop();
    }

    this.persist();
  }

  /**
   * Replace the input and persist the change.
   *
   * @param next Next request payload.
   */
  setInput(next: Record<string, unknown>): void {
    this.input = next;
    this.persist();
  }

  /**
   * Replace the output and persist the change.
   *
   * @param next Pretty-printed response payload.
   */
  setOutput(next: string): void {
    this.output = next;
    this.outputDate = next ? new Date().toISOString() : "";
    this.persist();
  }

  /**
   * Remove one history entry by index.
   *
   * @param index Position of the entry, newest first.
   */
  deleteHistoryItem(index: number): void {
    if (index < 0 || index >= this.history.length) return;
    this.history.splice(index, 1);
    this.persist();
  }

  /**
   * Remove every history entry.
   */
  clearHistory(): void {
    this.history = [];
    this.persist();
  }

  /**
   * Reset the request payload to an empty object.
   */
  clearInput(): void {
    this.input = {};
    this.persist();
  }

  /**
   * Reset the response payload.
   */
  clearOutput(): void {
    this.output = "";
    this.outputDate = "";
    this.persist();
  }
}
