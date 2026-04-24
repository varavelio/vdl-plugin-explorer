import type { IrSchema } from "@varavel/vdl-plugin-sdk";
import { isEmptyObject } from "@varavel/vdl-plugin-sdk/utils/predicates";
import { browser, dev } from "$app/environment";
import { EMPTY_IR } from "./types";

/**
 * Browser global values injected by the generated VDL explorer bundle.
 *
 * @remarks
 * In production builds, the plugin injects `window.__vdl_ir` so the explorer can
 * load the schema without performing network requests.
 */
declare global {
  interface Window {
    /**
     * IR schema generated from source definitions.
     *
     * @remarks
     * This value is injected at build time by the VDL plugin runtime.
     */
    __vdl_ir?: IrSchema;
  }
}

/**
 * Load a development IR schema mock from `ir.local.json`.
 *
 * @remarks
 * This function relies on Vite's `import.meta.glob` with an explicit root-relative
 * path to include the local mock file only when it exists.
 *
 * In development mode, place an `ir.local.json` file at the workspace root to
 * iterate on the explorer UI without running the plugin generation flow.
 *
 * @returns The mock IR schema when available; otherwise {@link EMPTY_IR}.
 */
function findMockIr(): IrSchema {
  type IrMockModule =
    | {
        default?: IrSchema;
      }
    | undefined;

  // Load the local IR mock file using Vite's import.meta.glob.
  const files = import.meta.glob("../../../../../ir.local.json", {
    eager: true,
  });

  const mockModule = files["../../../../../ir.local.json"] as IrMockModule;
  if (!mockModule?.default) return EMPTY_IR;

  console.log("[DEV] Default IR loaded from ir.local.json");
  return mockModule.default;
}

/**
 * Check whether a non-empty IR payload is available on the browser global scope.
 *
 * @remarks
 * This acts as a guard before reading the runtime-injected payload and prevents
 * server-side access to `window`.
 *
 * @returns `true` when `window.__vdl_ir` exists and is not an empty object.
 */
function hasProductionIr(): boolean {
  return browser && !!window.__vdl_ir && !isEmptyObject(window.__vdl_ir);
}

/**
 * Load the runtime IR schema injected in browser production builds.
 *
 * @remarks
 * Server-side rendering and missing/empty injected payloads both fall back to
 * {@link EMPTY_IR} to guarantee a predictable shape for downstream consumers.
 *
 * @returns The injected runtime IR schema when available; otherwise {@link EMPTY_IR}.
 */
function findProductionIr(): IrSchema {
  if (!hasProductionIr()) return EMPTY_IR;
  return window.__vdl_ir as IrSchema;
}

/**
 * Load the base IR schema without applying rich explorer metadata.
 *
 * @remarks
 * - Runtime-injected schema (`window.__vdl_ir`) takes precedence when present.
 * - If no runtime payload is available and `dev` is enabled, `ir.local.json` is used.
 * - Otherwise, the loader falls back to {@link EMPTY_IR}.
 *
 * @returns Base IR schema from runtime payload, development fixture, or empty fallback.
 */
export function loadRawIrSchema(): IrSchema {
  if (hasProductionIr()) {
    return findProductionIr();
  }

  if (dev) {
    return findMockIr();
  }

  return EMPTY_IR;
}
