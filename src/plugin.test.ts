import { describe, expect, test } from "bun:test"

import { type ModuleBoundaryContext, moduleBoundaries } from "./plugin"

const boundaries = [
  {
    root: "/repository/packages/example/src",
    isAllowed: (path: string) => path.startsWith("shared/"),
  },
]

describe("moduleBoundaries", () => {
  test("reports a violation with its importer", () => {
    const plugin = moduleBoundaries({
      boundaries,
      formatError: ({ id, importer }) => `${id} imported by ${importer}`,
    })
    const transform = plugin.transform
    if (typeof transform !== "function") {
      throw new Error("Expected moduleBoundaries to define a transform hook")
    }

    expect(() =>
      transform.call(
        {
          getModuleInfo: () => ({
            importers: ["/repository/packages/example/src/client.ts"],
            dynamicImporters: [],
          }),
          error: (message: unknown) => {
            throw new Error(String(message))
          },
        } as never,
        "",
        "/repository/packages/example/src/server.ts",
      ),
    ).toThrow(
      "/repository/packages/example/src/server.ts imported by /repository/packages/example/src/client.ts",
    )
  })

  test("passes SSR context to shouldCheck and skips unchecked modules", () => {
    let checkedContext: ModuleBoundaryContext | undefined
    const plugin = moduleBoundaries({
      boundaries,
      shouldCheck: (context) => {
        checkedContext = context
        return false
      },
      formatError: () => "Unexpected violation",
    })
    const transform = plugin.transform
    if (typeof transform !== "function") {
      throw new Error("Expected moduleBoundaries to define a transform hook")
    }

    expect(
      transform.call(
        {} as never,
        "",
        "/repository/packages/example/src/server.ts",
        { ssr: true },
      ),
    ).toBeUndefined()
    expect(checkedContext).toEqual({
      id: "/repository/packages/example/src/server.ts",
      ssr: true,
    })
  })

  test.each([
    [
      "uses a dynamic importer when no static importer exists",
      {
        importers: [],
        dynamicImporters: ["/repository/packages/example/src/lazy-client.ts"],
      },
      "/repository/packages/example/src/lazy-client.ts",
    ],
    ["reports no importer when module info is unavailable", null, undefined],
  ] as const)("%s", (_name, moduleInfo, expectedImporter) => {
    const plugin = moduleBoundaries({
      boundaries,
      formatError: ({ importer }) => `Importer: ${importer}`,
    })
    const transform = plugin.transform
    if (typeof transform !== "function") {
      throw new Error("Expected moduleBoundaries to define a transform hook")
    }

    expect(() =>
      transform.call(
        {
          getModuleInfo: () => moduleInfo,
          error: (message: unknown) => {
            throw new Error(String(message))
          },
        } as never,
        "",
        "/repository/packages/example/src/server.ts",
      ),
    ).toThrow(`Importer: ${expectedImporter}`)
  })
})
