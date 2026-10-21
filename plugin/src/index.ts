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
const DEFAULT_HTTP_RPC_BASE_URL = "https://<baseURL>";

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
 * Resolves the base URLs used to render HTTP RPC procedure endpoints in the
 * explorer.
 *
 * The plugin reads `httpRpcBaseUrl` from options as a comma-separated list,
 * following the same convention as the `baseUrl` option of the HTTP RPC
 * OpenAPI plugin, and falls back to `https://<baseURL>` when the option is
 * missing or blank.
 *
 * @param input - Plugin invocation payload received from VDL.
 * @returns A non-empty list of HTTP RPC base URLs.
 */
function resolveHttpRpcBaseUrls(input: PluginInput): string[] {
  const baseUrls = options.getOptionArray(
    input.options,
    "httpRpcBaseUrl",
    [],
    ",",
  );

  return baseUrls.length > 0 ? baseUrls : [DEFAULT_HTTP_RPC_BASE_URL];
}

/**
 * Generates an HTML file embedding the VDL IR for the explorer application.
 *
 * Supported plugin options:
 * - `outFile`: output filename (default: `index.html`)
 * - `httpRpcBaseUrl`: comma-separated base URLs used for HTTP RPC procedure
 *   endpoint display (default: `https://<baseURL>`)
 *
 * @param input - Plugin invocation payload provided by VDL.
 * @returns One generated HTML file containing the explorer app and IR data.
 */
export const generate = definePlugin((input) => {
  // Remove entrypoint information from IR
  input.ir.entryPoint = "";

  const outFile = resolveOutFile(input);
  const ir = escapeScriptTag(JSON.stringify(anonymizeIr(input.ir)));

  // The HTTP RPC base URLs escaped and sanitized
  const httpRpcBaseUrl = escapeScriptTag(
    JSON.stringify(resolveHttpRpcBaseUrls(input).join(",")),
  );

  let html = template.replace(
    "window.__vdl_ir = {};",
    `window.__vdl_ir = ${ir};`,
  );
  html = html.replace(
    'window.__vdl_http_rpc_base_url = "https://<baseURL>";',
    `window.__vdl_http_rpc_base_url = ${httpRpcBaseUrl};`,
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
