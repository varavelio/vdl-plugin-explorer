import { browser } from "$app/environment";
import {
  EMPTY_RICH_IR,
  loadIrSchema,
  type RichIrSchema,
  type SourceCode,
} from "$lib/store/ir/index";

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

  constructor() {
    if (!browser || this.initialized) return;
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
}

/**
 * Singleton instance of the Store class which holds all the application
 * shared state. This instance can be directly imported and used across
 * the application components.
 */
export const store = new Store();
