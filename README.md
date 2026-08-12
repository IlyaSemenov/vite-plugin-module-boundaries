# vite-plugin-module-boundaries

A Vite plugin that fails a build when modules outside configured filesystem surfaces enter a selected module graph.

## Install

```sh
npm install --save-dev vite-plugin-module-boundaries
```

Vite is a peer dependency and must be installed in the consuming project.

## Usage

```ts
import { defineConfig } from "vite"
import { moduleBoundaries } from "vite-plugin-module-boundaries"

export default defineConfig({
  plugins: [
    moduleBoundaries({
      boundaries: [
        {
          root: "/project/packages/example/src",
          isAllowed: (path) => path.startsWith("shared/"),
        },
      ],
      formatError: ({ id, importer }) =>
        `Forbidden module: ${id}${importer ? ` imported by ${importer}` : ""}`,
    }),
  ],
})
```

Each boundary restricts modules below an absolute filesystem `root`.
The `isAllowed` callback receives a normalized, root-relative path with `/` separators.
Modules inside nested `node_modules` directories are ignored.

Use `shouldCheck` to select Vite module graphs or individual modules.

```ts
moduleBoundaries({
  boundaries,
  shouldCheck: ({ ssr }) => !ssr,
  formatError: ({ id }) => `Server-only module entered the client graph: ${id}`,
})
```

Vite query parameters are removed before paths are checked.
When available, `formatError` receives the first static importer, or the first dynamic importer when no static importer exists.
