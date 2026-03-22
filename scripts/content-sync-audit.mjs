import { readFileSync } from 'fs'

const THEME_FILES = {
  dark: 'themes/hearth-dark.json',
  darkSoft: 'themes/hearth-dark-soft.json',
  light: 'themes/hearth-light.json',
  lightSoft: 'themes/hearth-light-soft.json',
}

const I18N_FILES = {
  en: 'src/i18n/en.json',
  zh: 'src/i18n/zh.json',
  ja: 'src/i18n/ja.json',
}

const EXTENSION_README = 'extension/README.md'
const README_JA = 'README.ja.md'
const LEGACY_HEX = ['#2a2723', '#ece2d3']

const issues = []

function addIssue(message) {
  issues.push(message)
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    addIssue(`${path}: failed to parse JSON (${error.message})`)
    return null
  }
}

function readText(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch (error) {
    addIssue(`${path}: failed to read (${error.message})`)
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

function extractHexes(text) {
  if (typeof text !== 'string') return []
  return [...text.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((match) => match[0].toLowerCase())
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
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const [r, g, b] = rgb.map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a, b) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  if (l1 == null || l2 == null) return null
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return (hi + 0.05) / (lo + 0.05)
}

function fixed(value) {
  return Number(value).toFixed(1)
}

function getTokenColor(theme, scope) {
  for (const entry of theme.tokenColors || []) {
    const scopes = Array.isArray(entry.scope) ? entry.scope : [entry.scope]
    if (!scopes.includes(scope)) continue
    const color = normalizeHex(entry.settings?.foreground)
    if (color) return color
  }
  return null
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function validatePhilosophyCopy() {
  const dark = readJson(THEME_FILES.dark)
  const darkSoft = readJson(THEME_FILES.darkSoft)
  const light = readJson(THEME_FILES.light)
  const lightSoft = readJson(THEME_FILES.lightSoft)
  if (!dark || !darkSoft || !light || !lightSoft) return

  const expectedHex = [
    normalizeHex(dark.colors?.['editor.background']),
    normalizeHex(darkSoft.colors?.['editor.background']),
    normalizeHex(light.colors?.['editor.background']),
    normalizeHex(lightSoft.colors?.['editor.background']),
  ].filter(Boolean)

  for (const [lang, file] of Object.entries(I18N_FILES)) {
    const dict = readJson(file)
    if (!dict) continue

    const body = dict['philosophy.02.body']
    if (typeof body !== 'string') {
      addIssue(`${file}: missing "philosophy.02.body"`)
      continue
    }

    const hexSet = new Set(extractHexes(body))
    for (const hex of expectedHex) {
      if (!hexSet.has(hex)) {
        addIssue(`${file}: philosophy.02.body missing expected hex ${hex}`)
      }
    }

    for (const staleHex of LEGACY_HEX) {
      if (hexSet.has(staleHex)) {
        addIssue(`${file}: philosophy.02.body still contains stale hex ${staleHex}`)
      }
    }

    if (lang !== 'en' && (hexSet.size < 4 || body.includes('3 variants'))) {
      addIssue(`${file}: philosophy.02.body appears stale or incomplete`)
    }
  }
}

function validateVariantCountCopy() {
  const checks = [
    {
      file: I18N_FILES.en,
      key: 'proof.metric.3.label',
      forbidden: [/\b3 variants\b/i, /three variants/i],
    },
    {
      file: I18N_FILES.zh,
      key: 'proof.metric.3.label',
      forbidden: [/三个变体/],
    },
    {
      file: I18N_FILES.ja,
      key: 'proof.metric.3.label',
      forbidden: [/3バリアント/],
    },
  ]

  for (const check of checks) {
    const dict = readJson(check.file)
    if (!dict) continue
    const value = dict[check.key]
    if (typeof value !== 'string') {
      addIssue(`${check.file}: missing "${check.key}"`)
      continue
    }
    for (const pattern of check.forbidden) {
      if (pattern.test(value)) {
        addIssue(`${check.file}: "${check.key}" still uses legacy variant count wording`)
      }
    }
  }

  const readmeJa = readText(README_JA)
  if (readmeJa && /3バリアント/.test(readmeJa)) {
    addIssue(`${README_JA}: still uses legacy "3バリアント" wording`)
  }
}

function validateExtensionReadmeSnapshot() {
  const themes = Object.fromEntries(
    Object.entries(THEME_FILES).map(([id, file]) => [id, readJson(file)])
  )
  if (Object.values(themes).some((theme) => !theme)) return

  const metrics = Object.fromEntries(
    Object.entries(themes).map(([id, theme]) => {
      const bg = normalizeHex(theme.colors?.['editor.background'])
      const fg = normalizeHex(theme.colors?.['editor.foreground'])
      const comment = getTokenColor(theme, 'comment')
      return [
        id,
        {
          fgBg: bg && fg ? contrastRatio(fg, bg) : null,
          commentBg: bg && comment ? contrastRatio(comment, bg) : null,
        },
      ]
    })
  )

  const readme = readText(EXTENSION_README)
  if (!readme) return

  const expectedLines = [
    ['Dark editor foreground/background contrast', fixed(metrics.dark.fgBg)],
    ['Dark Soft editor foreground/background contrast', fixed(metrics.darkSoft.fgBg)],
    ['Light editor foreground/background contrast', fixed(metrics.light.fgBg)],
    ['Light Soft editor foreground/background contrast', fixed(metrics.lightSoft.fgBg)],
  ]

  for (const [label, expected] of expectedLines) {
    const pattern = new RegExp(`- ${escapeRegExp(label)}:\\s*` + '`([^`]+)`')
    const match = readme.match(pattern)
    if (!match) {
      addIssue(`${EXTENSION_README}: missing line "${label}"`)
      continue
    }
    const actual = String(match[1]).trim()
    if (actual !== expected) {
      addIssue(`${EXTENSION_README}: "${label}" expected ${expected}, got ${actual}`)
    }
  }

  const commentValues = Object.values(metrics)
    .map((item) => item.commentBg)
    .filter((value) => value != null)
  const expectedMin = fixed(Math.min(...commentValues))
  const expectedMax = fixed(Math.max(...commentValues))
  const windowMatch = readme.match(/- Comment contrast window:\s*`([0-9.]+)\s*-\s*([0-9.]+)`/)
  if (!windowMatch) {
    addIssue(`${EXTENSION_README}: missing "Comment contrast window" line`)
  } else {
    const [, minValue, maxValue] = windowMatch
    if (minValue !== expectedMin || maxValue !== expectedMax) {
      addIssue(
        `${EXTENSION_README}: "Comment contrast window" expected ${expectedMin} - ${expectedMax}, got ${minValue} - ${maxValue}`
      )
    }
  }
}

function run() {
  validatePhilosophyCopy()
  validateVariantCountCopy()
  validateExtensionReadmeSnapshot()

  if (issues.length > 0) {
    console.error('[FAIL] Content sync audit found issues:')
    for (const issue of issues) {
      console.error(`  - ${issue}`)
    }
    process.exit(1)
  }

  console.log('[PASS] Content sync audit passed.')
}

run()
