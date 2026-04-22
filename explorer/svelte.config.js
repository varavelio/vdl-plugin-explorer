import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
    runes: ({ filename }) =>
      filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
  },
  kit: {
    adapter: adapter({
      strict: true,
    }),

    // Enable hash routing since this SPA is designed to be a single HTML file.
    // This also disables page options like prerendering and server-side rendering
    // which aren't compatible with the single hash-based routing.
    router: {
      type: "hash",
    },

    // Always output the SPA as a single self contained HTML file.
    output: {
      bundleStrategy: "inline",
    },
  },
};

export default config;
