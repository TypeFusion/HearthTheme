import { execSync } from 'node:child_process'
import {
  COLOR_SYSTEM_SEMANTIC_PATH,
  COLOR_SYSTEM_TEMPLATES_DIR,
  DOCS_COLOR_LANGUAGE_REPORT_PATH,
  DOCS_CONTRACT_CHECKLIST_PATH,
  DOCS_CONTRACT_REVIEW_PATH,
  DOCS_THEME_BASELINE_PATH,
  EXTENSION_PACKAGE_JSON_PATH,
  EXTENSION_THEMES_DIR,
  OBSIDIAN_APP_THEME_DIR,
  OBSIDIAN_THEMES_DIR,
  REPORT_COLOR_LANGUAGE_CONSISTENCY_PATH,
  REPORT_COLOR_LANGUAGE_LINEAGE_PATH,
  REPORT_COLOR_LANGUAGE_PARITY_PATH,
  REPORT_VSCODE_CHROME_RESIDUAL_PATH,
  SITE_PRODUCT_DATA_PATH,
  SITE_PUBLIC_THEMES_DIR,
  SITE_THEME_VARS_PATH,
  SITE_TOKENS_PATH,
  THEMES_DIR,
} from './paths.mjs'

const SYNCED_PATHS = [
  'color-system/ember-dark.source.json',
  COLOR_SYSTEM_TEMPLATES_DIR,
  COLOR_SYSTEM_SEMANTIC_PATH,
  THEMES_DIR,
  SITE_PUBLIC_THEMES_DIR,
  EXTENSION_THEMES_DIR,
  OBSIDIAN_THEMES_DIR,
  OBSIDIAN_APP_THEME_DIR,
  DOCS_COLOR_LANGUAGE_REPORT_PATH,
  DOCS_CONTRACT_CHECKLIST_PATH,
  DOCS_CONTRACT_REVIEW_PATH,
  REPORT_COLOR_LANGUAGE_LINEAGE_PATH,
  REPORT_COLOR_LANGUAGE_CONSISTENCY_PATH,
  REPORT_COLOR_LANGUAGE_PARITY_PATH,
  SITE_TOKENS_PATH,
  SITE_PRODUCT_DATA_PATH,
  SITE_THEME_VARS_PATH,
  DOCS_THEME_BASELINE_PATH,
  EXTENSION_PACKAGE_JSON_PATH,
  REPORT_VSCODE_CHROME_RESIDUAL_PATH,
]

function run(command, options = {}) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  })
}

function shellEscape(value) {
  if (/^[A-Za-z0-9._/:-]+$/.test(value)) return value
  return `"${value.replace(/"/g, '\\"')}"`
}

function diffChangedFiles(paths) {
  const targetArgs = paths.map(shellEscape).join(' ')
  const output = run(`git diff --name-only -- ${targetArgs}`)
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function toSet(items) {
  return new Set(items.map((item) => item.trim()).filter(Boolean))
}

function difference(left, right) {
  const out = []
  for (const item of left) {
    if (!right.has(item)) out.push(item)
  }
  return out.sort()
}

function main() {
  const beforeSync = toSet(diffChangedFiles(SYNCED_PATHS))

  process.stdout.write('[sync-check] Running theme sync...\n')
  execSync('node scripts/sync-themes.mjs', { stdio: 'inherit' })

  const afterSync = toSet(diffChangedFiles(SYNCED_PATHS))
  const introduced = difference(afterSync, beforeSync)

  if (introduced.length > 0) {
    process.stderr.write('\n[sync-check] Generated files drift detected after sync.\n')
    process.stderr.write('[sync-check] Stage/update these files before committing:\n')
    for (const file of introduced) {
      process.stderr.write(`  - ${file}\n`)
    }
    process.stderr.write('\nRun: pnpm run sync && git add <files> && commit again.\n')
    process.exit(1)
  }

  process.stdout.write('[sync-check] OK: generated artifacts are in sync.\n')
}

main()
