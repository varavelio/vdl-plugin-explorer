import { definePlugin } from "@varavel/vdl-plugin-sdk";
import { escapeScriptTag } from "@varavel/vdl-plugin-sdk/utils/strings";
import template from "../../explorer/build/index.html?raw";

export const generate = definePlugin((input) => {
  const ir = escapeScriptTag(JSON.stringify(input.ir));
  const html = template.replace("var __vdl_ir = {};", `var __vdl_ir = ${ir};`);

  return {
    files: [
      {
        path: "index.html",
        content: html,
      },
    ],
  };
});
