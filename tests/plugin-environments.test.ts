import { expect, test } from "bun:test"

import { resolveConfig } from "vite"

import { moduleBoundaries } from "../src"

test.each([
  ["serve", false],
  ["build", true],
] as const)("enables boundary checks for %s: %s", async (command, enabled) => {
  const plugin = moduleBoundaries({
    boundaries: [],
    formatError: ({ id }) => `Forbidden module: ${id}`,
  })
  const config = await resolveConfig(
    { configFile: false, envFile: false, plugins: [plugin] },
    command,
  )

  expect(config.plugins.includes(plugin)).toBe(enabled)
})
