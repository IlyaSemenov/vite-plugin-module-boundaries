import { relative } from "node:path"

/**
 * Defines a restricted filesystem root and the allowed surfaces within it.
 */
export interface ModuleBoundary {
  /** Absolute path to the restricted root. */
  root: string
  /** Checks a normalized path relative to the root. */
  isAllowed(path: string): boolean
}

/**
 * Returns the normalized path of a module that violates one of the supplied boundaries.
 */
export function findModuleBoundaryViolation(
  id: string,
  boundaries: readonly ModuleBoundary[],
): string | undefined {
  const modulePath = normalizePath(id.split("?", 1)[0] ?? "")

  for (const boundary of boundaries) {
    const pathWithinBoundary = pathWithin(boundary.root, modulePath)
    if (
      pathWithinBoundary &&
      !pathWithinBoundary.split("/").includes("node_modules") &&
      !boundary.isAllowed(pathWithinBoundary)
    ) {
      return modulePath
    }
  }
}

function pathWithin(root: string, path: string): string | undefined {
  const pathFromRoot = normalizePath(relative(root, path))
  if (
    pathFromRoot &&
    pathFromRoot !== ".." &&
    !pathFromRoot.startsWith("../")
  ) {
    return pathFromRoot
  }
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/")
}
