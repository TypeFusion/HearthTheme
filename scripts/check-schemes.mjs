import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SCHEMES_ROOT = 'color-system/schemes'
const ACTIVE_SCHEME_PATH = 'color-system/active-scheme.json'
const REQUIRED_FILES = [
  'scheme.json',
  'philosophy.md',
  'taxonomy.json',
  'foundation.json',
  'semantic-rules.json',
  'surface-rules.json',
  'guidance-rules.json',
  'terminal-rules.json',
  'interface-rules.json',
  'interaction-rules.json',
  'feedback-rules.json',
  'variant-knobs.json',
]

function fail(message) {
  console.error(`[FAIL] ${message}`)
  process.exit(1)
}

function run(commandArgs, env) {
  execFileSync(process.execPath, commandArgs, {
    stdio: 'inherit',
    env,
  })
}

function listSchemeIds() {
  return readdirSync(SCHEMES_ROOT)
    .filter((entry) => statSync(join(SCHEMES_ROOT, entry)).isDirectory())
    .sort()
}

function getConfiguredActiveScheme() {
  const data = JSON.parse(readFileSync(ACTIVE_SCHEME_PATH, 'utf8'))
  const schemeId = String(data?.schemeId || '').trim()
  const schemeDir = String(data?.schemeDir || '').trim()
  if (!schemeId || !schemeDir) {
    fail(`${ACTIVE_SCHEME_PATH} must define schemeId and schemeDir`)
  }
  return { schemeId, schemeDir }
}

function main() {
  const schemeIds = listSchemeIds()
  const activeScheme = getConfiguredActiveScheme()
  if (schemeIds.length === 0) {
    fail(`No schemes found under ${SCHEMES_ROOT}`)
  }

  for (const schemeId of schemeIds) {
    const schemeDir = join(SCHEMES_ROOT, schemeId)
    for (const file of REQUIRED_FILES) {
      const path = join(schemeDir, file)
      if (!existsSync(path)) {
        fail(`Scheme "${schemeId}" is missing required file ${path}`)
      }
    }

    const env = {
      ...process.env,
      COLOR_SYSTEM_SCHEME_ID: schemeId,
      COLOR_SYSTEM_SCHEME_DIR: schemeDir.replace(/\\/g, '/'),
    }

    console.log(`[scheme-check] Auditing ${schemeId}...`)
    run(['scripts/audit-source-layer.mjs'], env)
    run(['scripts/check-scheme-smoke.mjs'], env)
  }

  run(
    ['scripts/generate-theme-variants.mjs'],
    {
      ...process.env,
      COLOR_SYSTEM_SCHEME_ID: activeScheme.schemeId,
      COLOR_SYSTEM_SCHEME_DIR: activeScheme.schemeDir,
    }
  )

  console.log(`[PASS] Scheme registry check passed (${schemeIds.length} schemes).`)
}

main()
