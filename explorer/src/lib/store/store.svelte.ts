import { browser } from "$app/environment";
import { EMPTY_RICH_IR, loadIrSchema, type RichIrSchema } from "$lib/store/ir";

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

  constructor() {
    if (!browser || this.initialized) return;
    this.init();
  }

  /**
   * Initializes the store by loading the IR schema.
   */
  private async init() {
    this.ir = await loadIrSchema();
    this.initialized = true;
  }
}

/**
 * Singleton instance of the Store class which holds all the application
 * shared state. This instance can be directly imported and used across
 * the application components.
 */
export const store = new Store();
