import { readFileSync } from 'fs'
import {
  COLOR_SYSTEM_COMPATIBILITY_BOUNDARIES_PATH,
  loadCompatibilityBoundaries,
} from './color-system.mjs'

const VSCODE_CHROME_RESIDUAL_REPORT_PATH = 'reports/vscode-chrome-residual.json'

function fail(message) {
  console.error(`[FAIL] ${message}`)
  process.exit(1)
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(`Unable to read ${path}: ${error.message}`)
  }
}

function main() {
  const boundaries = loadCompatibilityBoundaries()
  const report = readJson(VSCODE_CHROME_RESIDUAL_REPORT_PATH)

  const groups = boundaries.vscodeChromeResidual.groups
  const allowedKeys = new Map()
  for (const [groupId, group] of Object.entries(groups)) {
    for (const key of group.keys) {
      allowedKeys.set(key, {
        groupId,
        label: group.label,
      })
    }
  }

  const aggregateEntries = Array.isArray(report.aggregate?.entries) ? report.aggregate.entries : null
  if (!aggregateEntries) {
    fail(`${VSCODE_CHROME_RESIDUAL_REPORT_PATH}: aggregate.entries must be an array`)
  }

  const actualCompatibilityKeys = new Set()

  for (const entry of aggregateEntries) {
    const key = String(entry?.key || '').trim()
    if (!key) fail(`${VSCODE_CHROME_RESIDUAL_REPORT_PATH}: aggregate entry is missing key`)

    const expectedBoundary = allowedKeys.get(key)
    if (!expectedBoundary) {
      fail(`${VSCODE_CHROME_RESIDUAL_REPORT_PATH}: residual key "${key}" is not declared in ${COLOR_SYSTEM_COMPATIBILITY_BOUNDARIES_PATH}`)
    }

    if (!entry.compatibilityBoundary) {
      fail(`${VSCODE_CHROME_RESIDUAL_REPORT_PATH}: residual key "${key}" must be marked compatibilityBoundary=true`)
    }

    if (entry.compatibilityGroup !== expectedBoundary.groupId) {
      fail(`${VSCODE_CHROME_RESIDUAL_REPORT_PATH}: residual key "${key}" should belong to compatibility group "${expectedBoundary.groupId}", found "${entry.compatibilityGroup}"`)
    }

    actualCompatibilityKeys.add(key)
  }

  for (const key of allowedKeys.keys()) {
    if (!actualCompatibilityKeys.has(key)) {
      fail(`${COLOR_SYSTEM_COMPATIBILITY_BOUNDARIES_PATH}: compatibility key "${key}" is stale and no longer appears in ${VSCODE_CHROME_RESIDUAL_REPORT_PATH}`)
    }
  }

  console.log(`[PASS] Compatibility-boundary audit passed (${actualCompatibilityKeys.size} residual keys covered).`)
}

main()
