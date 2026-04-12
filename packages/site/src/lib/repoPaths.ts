import path from 'node:path'

function requirePathEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required path environment variable: ${name}`)
  }

  return value
}

const SITE_PACKAGE_ROOT = requirePathEnv('HEARTH_SITE_ROOT')
const REPO_ROOT = requirePathEnv('HEARTH_REPO_ROOT')

export const SITE_PUBLIC_THEMES_DIR = path.join(SITE_PACKAGE_ROOT, 'public', 'themes')
export const COLOR_SYSTEM_ADAPTERS_PATH = path.join(REPO_ROOT, 'color-system', 'framework', 'adapters.json')
export const EXTENSION_CHANGELOG_PATH = path.join(REPO_ROOT, 'packages', 'extension', 'CHANGELOG.md')

export function resolveSiteThemePath(themePath: string): string {
  return path.join(SITE_PUBLIC_THEMES_DIR, path.basename(themePath))
}

export function resolveRepoPath(...segments: string[]): string {
  return path.join(REPO_ROOT, ...segments)
}
