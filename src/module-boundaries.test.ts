import { describe, expect, test } from "bun:test"

import { findModuleBoundaryViolation } from "./module-boundaries"

const boundaries = [
  {
    root: "/repository/packages/example/src",
    isAllowed: (path: string) => path.startsWith("shared/"),
  },
]

describe("findModuleBoundaryViolation", () => {
  test("returns a module from a forbidden surface", () => {
    expect(
      findModuleBoundaryViolation(
        "/repository/packages/example/src/server.ts",
        boundaries,
      ),
    ).toBe("/repository/packages/example/src/server.ts")
  })

  test("allows a configured surface", () => {
    expect(
      findModuleBoundaryViolation(
        "/repository/packages/example/src/shared/index.ts",
        boundaries,
      ),
    ).toBeUndefined()
  })

  test("ignores modules outside the root", () => {
    expect(
      findModuleBoundaryViolation(
        "/repository/packages/other/index.ts",
        boundaries,
      ),
    ).toBeUndefined()
  })

  test("strips Vite query parameters", () => {
    expect(
      findModuleBoundaryViolation(
        "/repository/packages/example/src/server.ts?v=1",
        boundaries,
      ),
    ).toBe("/repository/packages/example/src/server.ts")
  })

  test.each([
    "/repository/packages/example/src/node_modules/dependency/index.js",
    "/repository/packages/example/src/feature/node_modules/dependency/index.js",
  ])("ignores dependencies in node_modules at any depth", (id) => {
    expect(findModuleBoundaryViolation(id, boundaries)).toBeUndefined()
  })
})
