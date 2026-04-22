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

    // Enable hash routing since this SPA is meant to be a single HTML file
    router: {
      type: "hash",
    },
  },
};

export default config;
