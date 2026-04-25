import {
  assert,
  definePlugin,
  type PluginInput,
} from "@varavel/vdl-plugin-sdk";
import { anonymizeIr } from "@varavel/vdl-plugin-sdk/utils/ir";
import * as options from "@varavel/vdl-plugin-sdk/utils/options";
import { escapeScriptTag } from "@varavel/vdl-plugin-sdk/utils/strings";
import template from "../../explorer/build/index.html?raw";

const DEFAULT_OUTPUT_FILE = "index.html";
const DEFAULT_RPC_BASE_URL = "<baseURL>";

/**
 * Resolves the output filename for the generated HTML file.
 *
 * The plugin reads `outFile` from the plugin options and falls back to
 * `index.html` when the option is missing or blank.
 * It also validates that the output file ends with the `.html` extension.
 *
 * @param input - Plugin invocation payload received from VDL.
 * @returns A safe output filename.
 */
function resolveOutFile(input: PluginInput): string {
  const outFile = options.getOptionString(
    input.options,
    "outFile",
    DEFAULT_OUTPUT_FILE,
  );
  const trimmedOutFile = outFile.trim();

  const finalOutFile =
    trimmedOutFile.length > 0 ? trimmedOutFile : DEFAULT_OUTPUT_FILE;

  assert(
    finalOutFile.endsWith(".html"),
    `Invalid outFile "${finalOutFile}". The output file must end with .html`,
  );

  return finalOutFile;
}

/**
 * Resolves the base URL used to render RPC operation endpoints in the explorer.
 *
 * The plugin reads `rpcBaseUrl` from options and falls back to `<baseURL>`
 * when the option is missing or blank.
 *
 * @param input - Plugin invocation payload received from VDL.
 * @returns A non-empty RPC base URL value.
 */
function resolveRpcBaseUrl(input: PluginInput): string {
  const rpcBaseUrl = options.getOptionString(
    input.options,
    "rpcBaseUrl",
    DEFAULT_RPC_BASE_URL,
  );
  const trimmedRpcBaseUrl = rpcBaseUrl.trim();

  return trimmedRpcBaseUrl.length > 0
    ? trimmedRpcBaseUrl
    : DEFAULT_RPC_BASE_URL;
}

/**
 * Generates an HTML file embedding the VDL IR for the explorer application.
 *
 * Supported plugin options:
 * - `outFile`: output filename (default: `index.html`)
 * - `rpcBaseUrl`: base URL used for RPC endpoint display (default: `<baseURL>`)
 *
 * @param input - Plugin invocation payload provided by VDL.
 * @returns One generated HTML file containing the explorer app and IR data.
 */
export const generate = definePlugin((input) => {
  // Remove entrypoint information from IR
  input.ir.entryPoint = "";

  const outFile = resolveOutFile(input);
  const ir = escapeScriptTag(JSON.stringify(anonymizeIr(input.ir)));

  // The RPC base URL escaped and sanitized
  let rpcBaseUrl = escapeScriptTag(JSON.stringify(resolveRpcBaseUrl(input)));
  rpcBaseUrl = rpcBaseUrl.replace(/\/+$/, "");

  let html = template.replace(
    "window.__vdl_ir = {};",
    `window.__vdl_ir = ${ir};`,
  );
  html = html.replace(
    'window.__vdl_rpc_base_url = "<baseURL>";',
    `window.__vdl_rpc_base_url = ${rpcBaseUrl};`,
  );

  return {
    files: [
      {
        path: outFile,
        content: html,
      },
    ],
  };
});
