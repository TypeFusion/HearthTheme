import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { getReleaseVersion } from './release-metadata.mjs'

const REPORT_PATH = 'reports/color-language-consistency.json'
const OUTPUT_JSON = 'reports/color-language-version-summary.json'
const OUTPUT_MARKDOWN = 'reports/color-language-version-summary.md'

function parseArgs(argv) {
  const args = {
    baseRef: null,
    baseSha: null,
    headSha: null,
    outputJson: OUTPUT_JSON,
    outputMarkdown: OUTPUT_MARKDOWN,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
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
    if (arg === '--output-json') {
      args.outputJson = argv[i + 1] ?? OUTPUT_JSON
      i += 1
      continue
    }
    if (arg.startsWith('--output-json=')) {
      args.outputJson = arg.slice('--output-json='.length)
      continue
    }
    if (arg === '--output-md') {
      args.outputMarkdown = argv[i + 1] ?? OUTPUT_MARKDOWN
      i += 1
      continue
    }
    if (arg.startsWith('--output-md=')) {
      args.outputMarkdown = arg.slice('--output-md='.length)
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

function normalizeRef(value) {
  const normalized = String(value || '').trim()
  if (!normalized || /^0+$/.test(normalized)) return null
  return normalized
}

function resolveBaseSpec(args) {
  const explicitBaseSha = normalizeRef(args.baseSha)
  if (explicitBaseSha) return explicitBaseSha

  const explicitBaseRef = normalizeRef(args.baseRef)
  if (explicitBaseRef) {
    const ref = `origin/${explicitBaseRef}`
    const hasRef = tryRun(`git rev-parse --verify ${ref}`) != null
    if (!hasRef) {
      tryRun(`git fetch --no-tags --depth=1 origin ${explicitBaseRef}`)
    }
    return ref
  }

  const envBaseRef = normalizeRef(process.env.GITHUB_BASE_REF)
  if (envBaseRef) {
    return resolveBaseSpec({ ...args, baseRef: envBaseRef })
  }

  const envBeforeSha = normalizeRef(process.env.GITHUB_EVENT_BEFORE || process.env.BEFORE_SHA)
  if (envBeforeSha) return envBeforeSha

  const headParent = tryRun('git rev-parse --verify HEAD^')
  if (headParent != null) return 'HEAD^'

  return null
}

function resolveHeadSpec(args) {
  const explicit = normalizeRef(args.headSha)
  if (explicit) return explicit
  const envHead = normalizeRef(process.env.GITHUB_SHA || process.env.CURRENT_SHA)
  if (envHead) return envHead
  return 'HEAD'
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function readJsonFromGit(ref, path) {
  try {
    const content = run(`git show ${ref}:${path}`)
    return JSON.parse(content)
  } catch {
    return null
  }
}

function normalizeHex(hex) {
  if (typeof hex !== 'string') return null
  const value = hex.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(value)) return value
  if (/^#[0-9a-f]{8}$/.test(value)) return value.slice(0, 7)
  return null
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const raw = normalized.slice(1)
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16),
  ]
}

function toLinear(channel) {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function rgbToXyz([r, g, b]) {
  const rl = toLinear(r)
  const gl = toLinear(g)
  const bl = toLinear(b)
  return [
    rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375,
    rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175,
    rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041,
  ]
}

function xyzToLab([x, y, z]) {
  const xr = x / 0.95047
  const yr = y / 1.0
  const zr = z / 1.08883
  const f = (t) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116)
  const fx = f(xr)
  const fy = f(yr)
  const fz = f(zr)
  return [
    116 * fy - 16,
    500 * (fx - fy),
    200 * (fy - fz),
  ]
}

function deltaE(hexA, hexB) {
  const rgbA = hexToRgb(hexA)
  const rgbB = hexToRgb(hexB)
  if (!rgbA || !rgbB) return null
  const [l1, a1, b1] = xyzToLab(rgbToXyz(rgbA))
  const [l2, a2, b2] = xyzToLab(rgbToXyz(rgbB))
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2)
}

function fixed(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return 'n/a'
  return Number(value).toFixed(digits)
}

function round(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return null
  return Number(value.toFixed(digits))
}

function asRoleMap(report) {
  const rows = Array.isArray(report?.roles) ? report.roles : []
  return new Map(rows.map((row) => [row.id, row]))
}

function asPolarityMap(report) {
  const rows = Array.isArray(report?.lightPolarity) ? report.lightPolarity : []
  return new Map(rows.map((row) => [`${row.variantId}:${row.roleId}`, row]))
}

function collectVariantIds(report) {
  const ids = new Set()
  for (const row of report?.roles || []) {
    for (const variantId of Object.keys(row?.variants || {})) {
      ids.add(variantId)
    }
  }
  return [...ids].sort()
}

function buildRoleVariantChanges(previousReport, currentReport) {
  const previousRoles = asRoleMap(previousReport)
  const currentRoles = asRoleMap(currentReport)
  const roleIds = [...new Set([...previousRoles.keys(), ...currentRoles.keys()])].sort()
  const variantIds = collectVariantIds(currentReport)
  const changes = []

  for (const roleId of roleIds) {
    const previousRole = previousRoles.get(roleId)
    const currentRole = currentRoles.get(roleId)
    for (const variantId of variantIds) {
      const beforeEntry = previousRole?.variants?.[variantId] || null
      const afterEntry = currentRole?.variants?.[variantId] || null
      const beforeColor = beforeEntry?.textmate ?? null
      const afterColor = afterEntry?.textmate ?? null
      if (beforeColor === afterColor) continue

      changes.push({
        roleId,
        variantId,
        beforeColor,
        afterColor,
        deltaE: round(deltaE(beforeColor, afterColor), 2),
        contrastToBackgroundBefore: beforeEntry?.contrastToBackground ?? null,
        contrastToBackgroundAfter: afterEntry?.contrastToBackground ?? null,
      })
    }
  }

  return changes.sort((a, b) => {
    if (a.variantId !== b.variantId) return a.variantId.localeCompare(b.variantId)
    return a.roleId.localeCompare(b.roleId)
  })
}

function buildPolarityStatusChanges(previousReport, currentReport) {
  const previousRows = asPolarityMap(previousReport)
  const currentRows = asPolarityMap(currentReport)
  const keys = [...new Set([...previousRows.keys(), ...currentRows.keys()])].sort()
  const changes = []

  for (const key of keys) {
    const beforeRow = previousRows.get(key) || null
    const afterRow = currentRows.get(key) || null
    const beforeStatus = beforeRow?.status ?? null
    const afterStatus = afterRow?.status ?? null
    const beforeColor = beforeRow?.color ?? null
    const afterColor = afterRow?.color ?? null
    if (beforeStatus === afterStatus && beforeColor === afterColor) continue

    changes.push({
      variantId: afterRow?.variantId ?? beforeRow?.variantId ?? key.split(':')[0],
      roleId: afterRow?.roleId ?? beforeRow?.roleId ?? key.split(':')[1],
      beforeStatus,
      afterStatus,
      beforeColor,
      afterColor,
      beforeHueDistance: beforeRow?.metrics?.bgHueDistance ?? null,
      afterHueDistance: afterRow?.metrics?.bgHueDistance ?? null,
      beforeAnchorDeltaE: beforeRow?.metrics?.minAnchorDeltaE ?? null,
      afterAnchorDeltaE: afterRow?.metrics?.minAnchorDeltaE ?? null,
      beforeGuardDeltaE: beforeRow?.metrics?.minGuardDeltaE ?? null,
      afterGuardDeltaE: afterRow?.metrics?.minGuardDeltaE ?? null,
    })
  }

  return changes
}

function writeIfChanged(path, content) {
  mkdirSync(dirname(path), { recursive: true })
  if (existsSync(path)) {
    const prev = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
    const next = content.replace(/\r\n/g, '\n')
    if (prev === next) return false
  }
  writeFileSync(path, content)
  return true
}

function buildMarkdown(summary) {
  const lines = [
    '# Color Language Version Summary',
    '',
    `- Release version: \`${summary.releaseVersion}\``,
    `- Head: \`${summary.compare.head}\``,
    `- Base: \`${summary.compare.base ?? 'n/a'}\``,
    '',
  ]

  if (!summary.compare.baselineFound) {
    lines.push('Baseline report not found in base ref. Only current report is available.')
    return `${lines.join('\n')}\n`
  }

  lines.push(
    '## Totals',
    '',
    `- Role+variant color changes: ${summary.totals.roleVariantColorChanges}`,
    `- Touched roles: ${summary.totals.rolesTouched}`,
    `- Touched variants: ${summary.totals.variantsTouched}`,
    `- Polarity status/color changes: ${summary.totals.polarityStatusChanges}`,
    ''
  )

  lines.push(
    '## Role Variant Color Changes',
    '',
    '| Variant | Role | Before | After | DeltaE | Contrast Before | Contrast After |',
    '| --- | --- | --- | --- | --- | --- | --- |'
  )
  if (summary.roleVariantChanges.length === 0) {
    lines.push('| n/a | n/a | n/a | n/a | n/a | n/a | n/a |')
  } else {
    for (const change of summary.roleVariantChanges) {
      lines.push(
        `| ${change.variantId} | ${change.roleId} | ${change.beforeColor ?? 'n/a'} | ${change.afterColor ?? 'n/a'} | ${fixed(change.deltaE, 2)} | ${fixed(change.contrastToBackgroundBefore, 2)} | ${fixed(change.contrastToBackgroundAfter, 2)} |`
      )
    }
  }

  lines.push(
    '',
    '## Light Polarity Status Changes',
    '',
    '| Variant | Role | Status Before | Status After | Color Before | Color After | Hue(bg) Before | Hue(bg) After |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |'
  )
  if (summary.lightPolarityStatusChanges.length === 0) {
    lines.push('| n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |')
  } else {
    for (const change of summary.lightPolarityStatusChanges) {
      lines.push(
        `| ${change.variantId} | ${change.roleId} | ${change.beforeStatus ?? 'n/a'} | ${change.afterStatus ?? 'n/a'} | ${change.beforeColor ?? 'n/a'} | ${change.afterColor ?? 'n/a'} | ${fixed(change.beforeHueDistance)} | ${fixed(change.afterHueDistance)} |`
      )
    }
  }

  return `${lines.join('\n')}\n`
}

export function generateColorLanguageChangeSummary(options = {}) {
  const args = {
    ...parseArgs(process.argv.slice(2)),
    ...options,
  }

  if (!existsSync(REPORT_PATH)) {
    throw new Error(`Missing current report: ${REPORT_PATH}. Run "pnpm run generate:color-report" first.`)
  }

  const head = resolveHeadSpec(args)
  const base = resolveBaseSpec(args)
  const currentReport = readJson(REPORT_PATH)
  const previousReport = base ? readJsonFromGit(base, REPORT_PATH) : null
  const baselineFound = previousReport != null

  const roleVariantChanges = baselineFound
    ? buildRoleVariantChanges(previousReport, currentReport)
    : []
  const lightPolarityStatusChanges = baselineFound
    ? buildPolarityStatusChanges(previousReport, currentReport)
    : []

  const touchedRoles = new Set(roleVariantChanges.map((item) => item.roleId))
  const touchedVariants = new Set(roleVariantChanges.map((item) => item.variantId))

  const summary = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    releaseVersion: getReleaseVersion(),
    compare: {
      base,
      head,
      baselineFound,
    },
    totals: {
      roleVariantColorChanges: roleVariantChanges.length,
      rolesTouched: touchedRoles.size,
      variantsTouched: touchedVariants.size,
      polarityStatusChanges: lightPolarityStatusChanges.length,
    },
    roleVariantChanges,
    lightPolarityStatusChanges,
  }

  const markdown = buildMarkdown(summary)
  const jsonChanged = writeIfChanged(args.outputJson, `${JSON.stringify(summary, null, 2)}\n`)
  const mdChanged = writeIfChanged(args.outputMarkdown, markdown)

  console.log(`${jsonChanged ? '✓ updated' : '- unchanged'} ${args.outputJson}`)
  console.log(`${mdChanged ? '✓ updated' : '- unchanged'} ${args.outputMarkdown}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    generateColorLanguageChangeSummary()
  } catch (error) {
    console.error(`[FAIL] ${error.message}`)
    process.exit(1)
  }
}
