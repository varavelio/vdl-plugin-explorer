import type { IrSchema } from "@varavel/vdl-plugin-sdk";
import { hash } from "@varavel/vdl-plugin-sdk/utils/crypto";
import { title } from "@varavel/vdl-plugin-sdk/utils/markdown";
import { isEmptyObject } from "@varavel/vdl-plugin-sdk/utils/predicates";
import { slugify } from "@varavel/vdl-plugin-sdk/utils/strings";
import { browser, dev } from "$app/environment";

// In development mode, place your IR schema in a file named ir.local.json at the
// root of the project. This allows you to work with a static IR schema without
// needing to run the VDL plugin or have a backend server running.

/**
 * Declare the global interface for the expected window varriable injected
 * by the VDL plugin at build time.
 */
declare global {
  interface Window {
    /**
     * This is injected by the VDL plugin at build time. It contains the IR
     * schema generated from the source code.
     */
    __vdl_ir?: IrSchema;
  }
}

/**
 * Same as IrSchema but with an additional "id" field for each type, enum, constant and doc.
 * This is used to identify each item in the IR schema with a unique ID, which can be used
 * for efficient lookups and references in the application for example from a URL slug.
 */
type IrSchemaWithIds = {
  entryPoint: string;
  types: (IrSchema["types"][number] & { id: string })[];
  enums: (IrSchema["enums"][number] & { id: string })[];
  constants: (IrSchema["constants"][number] & { id: string })[];
  docs: (IrSchema["docs"][number] & { id: string })[];
};

/**
 * Add unique IDs to each type, enum, constant and doc in the IR schema. The ID is generated
 * by slugifying the name or title of the item combined with a hash of its content to ensure
 * uniqueness.
 *
 * @param ir The IR schema to which IDs should be added.
 * @returns A new IR schema with IDs added to each type, enum, constant and doc.
 */
function addIdsToIrSchema(ir: IrSchema): IrSchemaWithIds {
  const types: IrSchemaWithIds["types"] = ir.types.map((type) => {
    const id = slugify(`${type.name}-${hash(type)}`);
    return { ...type, id };
  });

  const enums: IrSchemaWithIds["enums"] = ir.enums.map((en) => {
    const id = slugify(`${en.name}-${hash(en)}`);
    return { ...en, id };
  });

  const constants: IrSchemaWithIds["constants"] = ir.constants.map(
    (constant) => {
      const id = slugify(`${constant.name}-${hash(constant)}`);
      return { ...constant, id };
    },
  );

  const docs: IrSchemaWithIds["docs"] = ir.docs.map((doc) => {
    const id = slugify(`${title(doc.content)}-${hash(doc)}`);
    return { ...doc, id };
  });

  return {
    entryPoint: ir.entryPoint,
    types,
    enums,
    constants,
    docs,
  };
}

/**
 * An empty IR schema used as a fallback when no IR is available.
 */
const EMPTY_IR: IrSchema = {
  entryPoint: "",
  types: [],
  enums: [],
  constants: [],
  docs: [],
};

/**
 * Find the local IR mock file named ir.local.json at the root of the project and
 * return its content as an IrSchema.
 *
 * This is used in development mode to load a static IR schema without needing to
 * run the VDL plugin or have a backend server running.
 *
 * @returns The IR schema loaded from the local JSON file, or an empty IR schema
 * if the file is not found or cannot be loaded.
 */
function findLocalMock(): IrSchema {
  if (!dev) return EMPTY_IR;

  // Find the local IR mock file using Vite's import.meta.glob
  const files = import.meta.glob("../../../ir.local.json", { eager: true });

  // biome-ignore lint/suspicious/noExplicitAny: The type of the mock module is not known at compile time
  const mockModule = files["../../../ir.local.json"] as any;
  if (!mockModule?.default) return EMPTY_IR;

  console.log("[DEV] Default IR loaded from ir.local.json");
  return mockModule.default;
}

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
  ir: IrSchemaWithIds = $state(addIdsToIrSchema(EMPTY_IR));

  constructor() {
    if (this.initialized) return;
    if (!browser) return;

    // In development mode, load the IR from a local JSON file
    // named ir.local.json at the root of the project.
    if (dev) {
      this.ir = addIdsToIrSchema(findLocalMock());
    }

    // Load production IR from the global variable injected by the VDL plugin
    // in the window object.
    if (!dev && window.__vdl_ir && !isEmptyObject(window.__vdl_ir)) {
      this.ir = addIdsToIrSchema(window.__vdl_ir);
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
