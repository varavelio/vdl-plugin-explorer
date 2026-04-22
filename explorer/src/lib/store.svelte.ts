import type { IrSchema } from "@varavel/vdl-plugin-sdk";
import { isEmptyObject } from "@varavel/vdl-plugin-sdk/utils/predicates";

declare global {
  interface Window {
    /**
     * This is injected by the VDL plugin at build time. It contains the IR
     * schema generated from the source code.
     */
    __vdl_ir: IrSchema;
  }
}

/**
 * Store class holds all the application shared state.
 */
export class Store {
  initialized = $state(false);

  ir: IrSchema = $state({
    entryPoint: "",
    types: [],
    enums: [],
    constants: [],
    docs: [],
  });

  constructor() {
    if (this.initialized) return;
    if (typeof window === "undefined") return;

    if (!isEmptyObject(window.__vdl_ir)) {
      this.ir = window.__vdl_ir;
    }

    this.initialized = true;
  }
}

/**
 * Singleton instance of the Store class which holds all the application
 * shared state. This instance can be directly imported and used accross
 * the application components.
 */
export const store = new Store();
