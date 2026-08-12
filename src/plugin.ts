import type { Plugin } from "vite"

import {
  findModuleBoundaryViolation,
  type ModuleBoundary,
} from "./module-boundaries"

/**
 * Describes a Vite graph module for which boundary checks can be enabled or disabled.
 */
export interface ModuleBoundaryContext {
  /** Vite module identifier. */
  id: string
  /** Whether the module is being built for a server-side runtime. */
  ssr: boolean
}

/**
 * Contains a module that crossed a boundary and its nearest known importer.
 */
export interface ModuleBoundaryViolation {
  /** Normalized absolute path to the module that crossed a boundary. */
  id: string
  /** Importer identifier from the Vite module graph. */
  importer?: string
}

/**
 * Configures module-boundary checks against the actual Vite module graph.
 */
export interface ModuleBoundariesOptions {
  /** Filesystem boundaries to check. */
  boundaries: readonly ModuleBoundary[]
  /** Selects the graphs and modules to which the checks apply. */
  shouldCheck?(context: ModuleBoundaryContext): boolean
  /** Formats the diagnostic message for a boundary violation. */
  formatError(violation: ModuleBoundaryViolation): string
}

/**
 * Fails a Vite build when a forbidden module enters a checked graph.
 */
export function moduleBoundaries(options: ModuleBoundariesOptions): Plugin {
  return {
    name: "module-boundaries",
    enforce: "pre",
    transform(_code: string, id: string, transformOptions?: { ssr?: boolean }) {
      const context: ModuleBoundaryContext = {
        id,
        ssr: transformOptions?.ssr === true,
      }
      if (options.shouldCheck && !options.shouldCheck(context)) {
        return
      }

      const violation = findModuleBoundaryViolation(id, options.boundaries)
      if (!violation) {
        return
      }

      const moduleInfo = this.getModuleInfo(id)
      const importer =
        moduleInfo?.importers[0] ?? moduleInfo?.dynamicImporters[0]

      this.error(options.formatError({ id: violation, importer }))
    },
  }
}
