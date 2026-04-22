import { browser } from "$app/environment";
import { loadIrSchema, type RichIrSchema } from "$lib/store/ir";

/**
 * Empty rich IR used before browser-side initialization.
 */
const EMPTY_RICH_IR: RichIrSchema = {
  entryPoint: "",
  types: [],
  enums: [],
  constants: [],
  docs: [],
};

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

    this.ir = loadIrSchema();
    this.initialized = true;
  }
}

/**
 * Singleton instance of the Store class which holds all the application
 * shared state. This instance can be directly imported and used across
 * the application components.
 */
export const store = new Store();
