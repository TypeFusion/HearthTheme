import { readFileSync } from 'fs'
import { buildColorLanguageModel } from './color-system/build.mjs'
import { buildGeneratedPlatformTokenMaps } from './color-system/artifacts.mjs'
import { buildColorLanguageParity } from './color-system/parity.mjs'

const REPORT_PATH = 'reports/color-language-parity.json'

function fail(message) {
  console.error(`[FAIL] ${message}`)
  process.exit(1)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableValue(value[key])])
  )
}

function collectIssues(group, label, issues) {
  for (const [id, entry] of Object.entries(group || {})) {
    for (const [variantId, variant] of Object.entries(entry.variants || {})) {
      for (const issue of variant.issues || []) {
        issues.push(`${label}.${id}.${variantId}: ${issue.pair.join(' vs ')} deltaE=${issue.deltaE}, alphaDelta=${issue.alphaDelta}`)
      }
    }
  }
}

function main() {
  let report
  try {
    report = readJson(REPORT_PATH)
  } catch (error) {
    fail(`Unable to read ${REPORT_PATH}: ${error.message}`)
  }

  const model = buildColorLanguageModel()
  const artifactMaps = buildGeneratedPlatformTokenMaps(model)
  const expected = buildColorLanguageParity(model, artifactMaps)

  if (JSON.stringify(stableValue(report)) !== JSON.stringify(stableValue(expected))) {
    fail(`Parity report is out of sync with source inputs. Run: pnpm run sync`)
  }

  const issues = []
  collectIssues(report.roles, 'roles', issues)
  collectIssues(report.surfaces, 'surfaces', issues)
  collectIssues(report.guidances, 'guidances', issues)
  collectIssues(report.terminals, 'terminals', issues)
  collectIssues(report.interfaces, 'interfaces', issues)
  collectIssues(report.interactions, 'interactions', issues)
  collectIssues(report.feedbacks, 'feedbacks', issues)

  if (issues.length > 0) {
    fail(`Cross-platform parity drift detected:\n- ${issues.slice(0, 12).join('\n- ')}`)
  }

  console.log('[PASS] Parity audit passed.')
}

main()
