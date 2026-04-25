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
 * Generates an HTML file embedding the VDL IR for the explorer application.
 *
 * Supported plugin options:
 * - `outFile`: output filename (default: `index.html`)
 *
 * @param input - Plugin invocation payload provided by VDL.
 * @returns One generated HTML file containing the explorer app and IR data.
 */
export const generate = definePlugin((input) => {
  // Remove entrypoint information from IR
  input.ir.entryPoint = "";

  const outFile = resolveOutFile(input);
  const ir = escapeScriptTag(JSON.stringify(anonymizeIr(input.ir)));
  const html = template.replace(
    "window.__vdl_ir = {};",
    `window.__vdl_ir = ${ir};`,
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
