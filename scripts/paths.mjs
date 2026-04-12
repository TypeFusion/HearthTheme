import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = fileURLToPath(new URL('../', import.meta.url))

function joinPosix(...parts) {
  return parts
    .filter(Boolean)
    .map((part) => String(part).replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
}

export function repoPath(...parts) {
  return joinPosix(...parts)
}

export function resolveRepoPath(...parts) {
  return path.join(REPO_ROOT, ...parts)
}

export function relocateWorkspacePath(filePath) {
  const normalized = String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '')
  if (!normalized) return normalized
  if (normalized === 'public' || normalized.startsWith('public/')) {
    return repoPath(SITE_PACKAGE_DIR, normalized)
  }
  if (normalized === 'src' || normalized.startsWith('src/')) {
    return repoPath(SITE_PACKAGE_DIR, normalized)
  }
  if (normalized === 'extension' || normalized.startsWith('extension/')) {
    return repoPath('packages', normalized)
  }
  return normalized
}

export function resolveWorkspacePath(filePath) {
  return resolveRepoPath(...relocateWorkspacePath(filePath).split('/'))
}

export function repoRelativePath(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join('/')
}

export function pathBasename(filePath) {
  return path.posix.basename(String(filePath).replace(/\\/g, '/'))
}

export const THEMES_DIR = 'themes'
export const COLOR_SYSTEM_DIR = 'color-system'
export const COLOR_SYSTEM_FRAMEWORK_DIR = repoPath(COLOR_SYSTEM_DIR, 'framework')
export const COLOR_SYSTEM_ADAPTERS_PATH = repoPath(COLOR_SYSTEM_FRAMEWORK_DIR, 'adapters.json')
export const COLOR_SYSTEM_SEMANTIC_PATH = repoPath(COLOR_SYSTEM_DIR, 'semantic.json')
export const COLOR_SYSTEM_TEMPLATES_DIR = repoPath(COLOR_SYSTEM_DIR, 'templates')

export const SITE_PACKAGE_DIR = repoPath('packages', 'site')
export const SITE_PUBLIC_DIR = repoPath(SITE_PACKAGE_DIR, 'public')
export const SITE_PUBLIC_THEMES_DIR = repoPath(SITE_PUBLIC_DIR, 'themes')
export const SITE_PREVIEWS_DIR = repoPath(SITE_PUBLIC_DIR, 'previews')
export const SITE_SRC_DIR = repoPath(SITE_PACKAGE_DIR, 'src')
export const SITE_DATA_DIR = repoPath(SITE_SRC_DIR, 'data')
export const SITE_STYLES_DIR = repoPath(SITE_SRC_DIR, 'styles')
export const SITE_I18N_DIR = repoPath(SITE_SRC_DIR, 'i18n')
export const SITE_COMPONENTS_DIR = repoPath(SITE_SRC_DIR, 'components')
export const SITE_LAYOUTS_DIR = repoPath(SITE_SRC_DIR, 'layouts')
export const SITE_PRODUCT_DATA_PATH = repoPath(SITE_DATA_DIR, 'product.ts')
export const SITE_TOKENS_PATH = repoPath(SITE_DATA_DIR, 'tokens.ts')
export const SITE_THEME_VARS_PATH = repoPath(SITE_STYLES_DIR, 'theme-vars.css')
export const SITE_ASTRO_CONFIG_PATH = repoPath(SITE_PACKAGE_DIR, 'astro.config.mjs')
export const SITE_TSCONFIG_PATH = repoPath(SITE_PACKAGE_DIR, 'tsconfig.json')

export const EXTENSION_PACKAGE_DIR = repoPath('packages', 'extension')
export const EXTENSION_PACKAGE_JSON_PATH = repoPath(EXTENSION_PACKAGE_DIR, 'package.json')
export const EXTENSION_CHANGELOG_PATH = repoPath(EXTENSION_PACKAGE_DIR, 'CHANGELOG.md')
export const EXTENSION_THEMES_DIR = repoPath(EXTENSION_PACKAGE_DIR, 'themes')
export const EXTENSION_IMAGES_DIR = repoPath(EXTENSION_PACKAGE_DIR, 'images')
export const EXTENSION_README_PATH = repoPath(EXTENSION_PACKAGE_DIR, 'README.md')

export const OBSIDIAN_THEMES_DIR = repoPath('obsidian', 'themes')
export const OBSIDIAN_APP_THEME_DIR = repoPath('obsidian', 'app-theme')
export const DOCS_DIR = 'docs'
export const DOCS_THEME_BASELINE_PATH = repoPath(DOCS_DIR, 'theme-baseline.md')
export const DOCS_COLOR_LANGUAGE_REPORT_PATH = repoPath(DOCS_DIR, 'color-language-report.md')
export const DOCS_CONTRACT_CHECKLIST_PATH = repoPath(DOCS_DIR, 'color-language-contract-checklist.md')
export const DOCS_CONTRACT_REVIEW_PATH = repoPath(DOCS_DIR, 'color-language-contract-review.md')
export const REPORTS_DIR = 'reports'
export const REPORT_COLOR_LANGUAGE_LINEAGE_PATH = repoPath(REPORTS_DIR, 'color-language-lineage.json')
export const REPORT_COLOR_LANGUAGE_CONSISTENCY_PATH = repoPath(REPORTS_DIR, 'color-language-consistency.json')
export const REPORT_COLOR_LANGUAGE_PARITY_PATH = repoPath(REPORTS_DIR, 'color-language-parity.json')
export const REPORT_VSCODE_CHROME_RESIDUAL_PATH = repoPath(REPORTS_DIR, 'vscode-chrome-residual.json')
export const REPORT_PREVIEW_MANIFEST_PATH = repoPath(REPORTS_DIR, 'preview-manifest.json')
