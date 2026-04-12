import { execSync } from 'node:child_process'
import {
  COLOR_SYSTEM_SEMANTIC_PATH,
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
} from './paths.mjs'

const GENERATED_PATH_RULES = [
  { type: 'exact', value: COLOR_SYSTEM_SEMANTIC_PATH },
  { type: 'prefix', value: 'themes/' },
  { type: 'prefix', value: `${SITE_PUBLIC_THEMES_DIR}/` },
  { type: 'prefix', value: `${EXTENSION_THEMES_DIR}/` },
  { type: 'prefix', value: `${OBSIDIAN_THEMES_DIR}/` },
  { type: 'prefix', value: `${OBSIDIAN_APP_THEME_DIR}/` },
  { type: 'exact', value: DOCS_COLOR_LANGUAGE_REPORT_PATH },
  { type: 'exact', value: DOCS_CONTRACT_CHECKLIST_PATH },
  { type: 'exact', value: DOCS_CONTRACT_REVIEW_PATH },
  { type: 'exact', value: DOCS_THEME_BASELINE_PATH },
  { type: 'exact', value: REPORT_COLOR_LANGUAGE_LINEAGE_PATH },
  { type: 'exact', value: REPORT_COLOR_LANGUAGE_CONSISTENCY_PATH },
  { type: 'exact', value: REPORT_COLOR_LANGUAGE_PARITY_PATH },
  { type: 'exact', value: REPORT_VSCODE_CHROME_RESIDUAL_PATH },
  { type: 'exact', value: SITE_TOKENS_PATH },
  { type: 'exact', value: SITE_PRODUCT_DATA_PATH },
  { type: 'exact', value: SITE_THEME_VARS_PATH },
]

const SOURCE_OF_TRUTH_RULES = [
  { type: 'exact', value: 'color-system/active-scheme.json' },
  { type: 'exact', value: 'products/active-product.json' },
  { type: 'prefix', value: 'color-system/framework/' },
  { type: 'prefix', value: 'color-system/schemes/' },
  { type: 'prefix', value: 'products/' },
  { type: 'exact', value: 'color-system/ember-dark.source.json' },
  { type: 'prefix', value: 'color-system/templates/' },
  { type: 'prefix', value: 'releases/' },
  { type: 'prefix', value: 'scripts/' },
]

function parseArgs(argv) {
  const args = {
    staged: false,
    upstream: false,
    baseRef: null,
    baseSha: null,
    headSha: null,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--staged') {
      args.staged = true
      continue
    }
    if (arg === '--upstream') {
      args.upstream = true
      continue
    }
    if (arg === '--base-ref') {
      args.baseRef = argv[i + 1] ?? null
      i += 1
      continue
    }
    if (arg.startsWith('--base-ref=')) {
      args.baseRef = arg.slice('--base-ref='.length)
      continue
    }
    if (arg === '--base-sha') {
      args.baseSha = argv[i + 1] ?? null
      i += 1
      continue
    }
    if (arg.startsWith('--base-sha=')) {
      args.baseSha = arg.slice('--base-sha='.length)
      continue
    }
    if (arg === '--head-sha') {
      args.headSha = argv[i + 1] ?? null
      i += 1
      continue
    }
    if (arg.startsWith('--head-sha=')) {
      args.headSha = arg.slice('--head-sha='.length)
      continue
    }
  }

  return args
}

function run(command) {
  return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function tryRun(command) {
  try {
    return run(command)
  } catch {
    return null
  }
}

function normalizePath(path) {
  return path.trim().replace(/\\/g, '/')
}

function collectChangedFiles(command) {
  const output = tryRun(command)
  if (output == null) return null
  return output
    .split(/\r?\n/)
    .map(normalizePath)
    .filter(Boolean)
}

function matchesRule(path, rule) {
  if (rule.type === 'prefix') return path.startsWith(rule.value)
  return path === rule.value
}

function isGeneratedPath(path) {
  return GENERATED_PATH_RULES.some((rule) => matchesRule(path, rule))
}

function isSourceOfTruthPath(path) {
  return SOURCE_OF_TRUTH_RULES.some((rule) => matchesRule(path, rule))
}

function isVersionDerivedGeneratedPath(path) {
  return path === `${OBSIDIAN_APP_THEME_DIR}/manifest.json` || path === `${OBSIDIAN_APP_THEME_DIR}/versions.json`
}

function resolveDiffMode(args) {
  if (args.staged) {
    return {
      label: 'staged-index',
      files: collectChangedFiles('git diff --cached --name-only'),
    }
  }

  if (args.baseSha && args.headSha) {
    return {
      label: `${args.baseSha}..${args.headSha}`,
      files: collectChangedFiles(`git diff --name-only ${args.baseSha} ${args.headSha}`),
    }
  }

  if (args.baseRef) {
    const ref = `origin/${args.baseRef}`
    const hasRef = tryRun(`git rev-parse --verify ${ref}`) != null
    if (!hasRef) {
      tryRun(`git fetch --no-tags --depth=1 origin ${args.baseRef}`)
    }
    return {
      label: `${ref}...HEAD`,
      files: collectChangedFiles(`git diff --name-only ${ref}...HEAD`),
    }
  }

  if (args.upstream) {
    const upstream = tryRun('git rev-parse --abbrev-ref --symbolic-full-name @{u}')
    if (!upstream) {
      return {
        label: 'upstream',
        files: null,
      }
    }
    const ref = normalizePath(upstream)
    return {
      label: `${ref}...HEAD`,
      files: collectChangedFiles(`git diff --name-only ${ref}...HEAD`),
    }
  }

  const autoBaseRef = process.env.GITHUB_BASE_REF
  if (autoBaseRef) {
    return resolveDiffMode({ ...args, baseRef: autoBaseRef })
  }

  const autoBefore = process.env.GITHUB_EVENT_BEFORE || process.env.BEFORE_SHA
  const autoHead = process.env.GITHUB_SHA || process.env.CURRENT_SHA
  if (autoBefore && autoHead && !/^0+$/.test(autoBefore)) {
    return resolveDiffMode({ ...args, baseSha: autoBefore, headSha: autoHead })
  }

  return {
    label: 'none',
    files: null,
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const { label, files } = resolveDiffMode(args)

  if (files == null) {
    console.log('[SKIP] Generated-origin audit skipped (no reliable diff base).')
    return
  }

  const generatedChanged = files.filter(isGeneratedPath)
  if (generatedChanged.length === 0) {
    console.log(`[PASS] Generated-origin audit passed (${label}): no generated outputs changed.`)
    return
  }

  const hasSourceChange = files.some(isSourceOfTruthPath)
  const hasVersionSource =
    files.includes('releases/color-language.json') ||
    files.includes(EXTENSION_PACKAGE_JSON_PATH)
  const onlyVersionDerivedGenerated = generatedChanged.every(isVersionDerivedGeneratedPath)

  if (!hasSourceChange && hasVersionSource && onlyVersionDerivedGenerated) {
    console.log(
      `[PASS] Generated-origin audit passed (${label}): version-derived Obsidian metadata updated from release source.`
    )
    return
  }

  if (!hasSourceChange) {
    console.error('[FAIL] Generated-origin audit failed.')
    console.error('Generated outputs changed without changes in top-down color sources or scripts/:')
    for (const file of generatedChanged) {
      console.error(`  - ${file}`)
    }
    console.error(
      'Please modify active scheme / scheme core / framework calibration / templates or generators (scripts/) in the same change set.'
    )
    process.exit(1)
  }

  console.log(`[PASS] Generated-origin audit passed (${label}).`)
}

main()
