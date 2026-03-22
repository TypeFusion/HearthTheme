import { existsSync, readFileSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'

const DARK_THEME_PATH = 'themes/hearth-dark.json'
const TEMPLATE_DARK_PATH = 'themes/templates/hearth-dark.base.json'

const VARIANT_CONFIG = [
  {
    id: 'darkSoft',
    name: 'Hearth Dark Soft',
    type: 'dark',
    templatePath: 'themes/templates/hearth-dark-soft.base.json',
    outputPath: 'themes/hearth-dark-soft.json',
  },
  {
    id: 'light',
    name: 'Hearth Light',
    type: 'light',
    templatePath: 'themes/templates/hearth-light.base.json',
    outputPath: 'themes/hearth-light.json',
  },
  {
    id: 'lightSoft',
    name: 'Hearth Light Soft',
    type: 'light',
    templatePath: 'themes/templates/hearth-light-soft.base.json',
    outputPath: 'themes/hearth-light-soft.json',
  },
]

const REF_BG_KEY = 'editor.background'
const REF_FG_KEY = 'editor.foreground'

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path, data) {
  const next = `${JSON.stringify(data, null, 4)}\n`
  if (existsSync(path)) {
    const prev = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
    if (prev === next) return false
  }
  writeFileSync(path, next)
  return true
}

function normalizeHex(hex) {
  if (typeof hex !== 'string') return null
  const value = hex.trim().toLowerCase()
  if (/^#[0-9a-f]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
  }
  if (/^#[0-9a-f]{4}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}${value[4]}${value[4]}`
  }
  if (/^#[0-9a-f]{6}$/.test(value) || /^#[0-9a-f]{8}$/.test(value)) {
    return value
  }
  return null
}

function hexToRgba(hex) {
  const normalized = normalizeHex(hex)
  if (!normalized) return null

  const raw = normalized.slice(1)
  if (raw.length === 6) {
    return {
      r: Number.parseInt(raw.slice(0, 2), 16),
      g: Number.parseInt(raw.slice(2, 4), 16),
      b: Number.parseInt(raw.slice(4, 6), 16),
      a: 255,
      hasAlpha: false,
    }
  }

  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
    a: Number.parseInt(raw.slice(6, 8), 16),
    hasAlpha: true,
  }
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max)
}

function toHexByte(value) {
  return Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0')
}

function rgbaToHex({ r, g, b, a = 255, hasAlpha = false }) {
  const rgb = `${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`
  if (!hasAlpha) return `#${rgb}`
  return `#${rgb}${toHexByte(a)}`
}

function toLinear(channel) {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function fromLinear(channel) {
  const c = clamp(channel, 0, 1)
  const value = c <= 0.0031308 ? 12.92 * c : 1.055 * (c ** (1 / 2.4)) - 0.055
  return value * 255
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

function labToXyz([l, a, b]) {
  const fy = (l + 16) / 116
  const fx = a / 500 + fy
  const fz = fy - b / 200

  const fInv = (t) => {
    const t3 = t ** 3
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787
  }

  const xr = fInv(fx)
  const yr = fInv(fy)
  const zr = fInv(fz)

  return [xr * 0.95047, yr * 1.0, zr * 1.08883]
}

function xyzToRgb([x, y, z]) {
  const rl = x * 3.2404542 + y * -1.5371385 + z * -0.4985314
  const gl = x * -0.969266 + y * 1.8760108 + z * 0.041556
  const bl = x * 0.0556434 + y * -0.2040259 + z * 1.0572252
  return [
    fromLinear(rl),
    fromLinear(gl),
    fromLinear(bl),
  ]
}

function scopeSignature(entry) {
  if (!entry?.scope) return ''
  const scopes = Array.isArray(entry.scope) ? entry.scope : [entry.scope]
  return scopes.map((scope) => String(scope).trim()).filter(Boolean).sort().join(' | ')
}

function buildScopeBuckets(entries) {
  const buckets = new Map()
  for (const entry of entries || []) {
    const signature = scopeSignature(entry)
    if (!buckets.has(signature)) buckets.set(signature, [])
    buckets.get(signature).push(entry)
  }
  return buckets
}

function takeFromBucket(buckets, signature) {
  const bucket = buckets.get(signature)
  if (!bucket || bucket.length === 0) return null
  return bucket.shift()
}

function resolveHexValue(value) {
  return normalizeHex(typeof value === 'string' ? value : null)
}

function resolveSemanticForeground(value) {
  if (typeof value === 'string') return resolveHexValue(value)
  if (value && typeof value === 'object') return resolveHexValue(value.foreground)
  return null
}

function applyLabDelta(currentHex, baseDarkHex, baseVariantHex) {
  const current = hexToRgba(currentHex)
  const baseDark = hexToRgba(baseDarkHex)
  const baseVariant = hexToRgba(baseVariantHex)
  if (!current || !baseDark || !baseVariant) {
    return resolveHexValue(baseVariantHex) ?? resolveHexValue(currentHex) ?? currentHex
  }

  if (
    current.r === baseDark.r &&
    current.g === baseDark.g &&
    current.b === baseDark.b &&
    current.a === baseDark.a &&
    current.hasAlpha === baseDark.hasAlpha
  ) {
    return rgbaToHex({
      r: baseVariant.r,
      g: baseVariant.g,
      b: baseVariant.b,
      a: baseVariant.a,
      hasAlpha: baseVariant.hasAlpha,
    })
  }

  const currentLab = xyzToLab(rgbToXyz([current.r, current.g, current.b]))
  const darkLab = xyzToLab(rgbToXyz([baseDark.r, baseDark.g, baseDark.b]))
  const variantLab = xyzToLab(rgbToXyz([baseVariant.r, baseVariant.g, baseVariant.b]))

  const outLab = [
    currentLab[0] + (variantLab[0] - darkLab[0]),
    currentLab[1] + (variantLab[1] - darkLab[1]),
    currentLab[2] + (variantLab[2] - darkLab[2]),
  ]

  const [r, g, b] = xyzToRgb(labToXyz(outLab))
  const hasAlpha = current.hasAlpha || baseDark.hasAlpha || baseVariant.hasAlpha
  const alphaDelta = baseVariant.a - baseDark.a
  const a = clamp(current.a + alphaDelta, 0, 255)

  return rgbaToHex({ r, g, b, a, hasAlpha })
}

function transformColors(currentDark, baselineDark, baselineVariant, warnings, variantId) {
  const output = {}
  const fallbackDark = resolveHexValue(baselineDark.colors?.[REF_BG_KEY])
  const fallbackVariant = resolveHexValue(baselineVariant.colors?.[REF_BG_KEY])

  for (const [key, value] of Object.entries(currentDark.colors || {})) {
    const currentHex = resolveHexValue(value)
    if (!currentHex) {
      output[key] = value
      continue
    }

    const baseDarkHex = resolveHexValue(baselineDark.colors?.[key]) ?? fallbackDark
    const baseVariantHex = resolveHexValue(baselineVariant.colors?.[key]) ?? fallbackVariant

    if (!baseDarkHex || !baseVariantHex) {
      output[key] = currentHex
      warnings.push(`${variantId}: fallback copy for color "${key}" (template delta unavailable)`)
      continue
    }

    output[key] = applyLabDelta(currentHex, baseDarkHex, baseVariantHex)
  }

  return output
}

function transformTokenColors(currentDark, baselineDark, baselineVariant, warnings, variantId) {
  const darkBuckets = buildScopeBuckets(baselineDark.tokenColors)
  const variantBuckets = buildScopeBuckets(baselineVariant.tokenColors)
  const fallbackDark = resolveHexValue(baselineDark.colors?.[REF_FG_KEY])
  const fallbackVariant = resolveHexValue(baselineVariant.colors?.[REF_FG_KEY])

  return (currentDark.tokenColors || []).map((entry, index) => {
    const outEntry = {
      ...entry,
      settings: entry.settings ? { ...entry.settings } : undefined,
    }

    const currentHex = resolveHexValue(entry?.settings?.foreground)
    if (!currentHex) return outEntry

    const signature = scopeSignature(entry)
    const darkTemplateEntry = takeFromBucket(darkBuckets, signature)
    const variantTemplateEntry = takeFromBucket(variantBuckets, signature)

    const baseDarkHex = resolveHexValue(darkTemplateEntry?.settings?.foreground) ?? fallbackDark
    const baseVariantHex = resolveHexValue(variantTemplateEntry?.settings?.foreground) ?? fallbackVariant

    if (!baseDarkHex || !baseVariantHex) {
      warnings.push(`${variantId}: fallback copy for token scope[${index}] "${signature}"`)
      outEntry.settings.foreground = currentHex
      return outEntry
    }

    outEntry.settings.foreground = applyLabDelta(currentHex, baseDarkHex, baseVariantHex)
    return outEntry
  })
}

function transformSemanticTokenColors(currentDark, baselineDark, baselineVariant, warnings, variantId) {
  const output = {}
  const currentSem = currentDark.semanticTokenColors || {}
  const baselineDarkSem = baselineDark.semanticTokenColors || {}
  const baselineVariantSem = baselineVariant.semanticTokenColors || {}
  const fallbackDark = resolveHexValue(baselineDark.colors?.[REF_FG_KEY])
  const fallbackVariant = resolveHexValue(baselineVariant.colors?.[REF_FG_KEY])

  for (const [key, value] of Object.entries(currentSem)) {
    const baseDark = baselineDarkSem[key]
    const baseVariant = baselineVariantSem[key]

    if (typeof value === 'string') {
      const currentHex = resolveHexValue(value)
      const baseDarkHex = resolveSemanticForeground(baseDark) ?? fallbackDark
      const baseVariantHex = resolveSemanticForeground(baseVariant) ?? fallbackVariant
      if (!currentHex || !baseDarkHex || !baseVariantHex) {
        warnings.push(`${variantId}: fallback copy for semantic "${key}"`)
        output[key] = value
      } else {
        output[key] = applyLabDelta(currentHex, baseDarkHex, baseVariantHex)
      }
      continue
    }

    if (!value || typeof value !== 'object') {
      output[key] = value
      continue
    }

    const next = { ...value }
    const currentHex = resolveHexValue(value.foreground)
    if (!currentHex) {
      output[key] = next
      continue
    }

    const baseDarkHex = resolveSemanticForeground(baseDark) ?? fallbackDark
    const baseVariantHex = resolveSemanticForeground(baseVariant) ?? fallbackVariant
    if (!baseDarkHex || !baseVariantHex) {
      warnings.push(`${variantId}: fallback copy for semantic "${key}.foreground"`)
      next.foreground = currentHex
    } else {
      next.foreground = applyLabDelta(currentHex, baseDarkHex, baseVariantHex)
    }

    output[key] = next
  }

  return output
}

function validateTemplateAvailability(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing template file: ${path}`)
  }
}

function warnTemplateDrift(currentDark, baselineDark, warnings) {
  const currentColorKeys = new Set(Object.keys(currentDark.colors || {}))
  const baseColorKeys = new Set(Object.keys(baselineDark.colors || {}))
  const extraColorKeys = [...currentColorKeys].filter((key) => !baseColorKeys.has(key))
  if (extraColorKeys.length > 0) {
    warnings.push(`template drift: current dark has ${extraColorKeys.length} extra color key(s)`)
  }

  const currentTokenCount = (currentDark.tokenColors || []).length
  const baseTokenCount = (baselineDark.tokenColors || []).length
  if (currentTokenCount !== baseTokenCount) {
    warnings.push(`template drift: tokenColors count current=${currentTokenCount}, template=${baseTokenCount}`)
  }

  const currentSemKeys = new Set(Object.keys(currentDark.semanticTokenColors || {}))
  const baseSemKeys = new Set(Object.keys(baselineDark.semanticTokenColors || {}))
  const extraSemKeys = [...currentSemKeys].filter((key) => !baseSemKeys.has(key))
  if (extraSemKeys.length > 0) {
    warnings.push(`template drift: semanticTokenColors has ${extraSemKeys.length} extra key(s)`)
  }
}

function buildVariantTheme(currentDark, baselineDark, baselineVariant, variantMeta, warnings) {
  return {
    ...currentDark,
    name: variantMeta.name,
    type: variantMeta.type,
    colors: transformColors(currentDark, baselineDark, baselineVariant, warnings, variantMeta.id),
    tokenColors: transformTokenColors(currentDark, baselineDark, baselineVariant, warnings, variantMeta.id),
    semanticTokenColors: transformSemanticTokenColors(currentDark, baselineDark, baselineVariant, warnings, variantMeta.id),
  }
}

export function generateThemeVariants() {
  validateTemplateAvailability(DARK_THEME_PATH)
  validateTemplateAvailability(TEMPLATE_DARK_PATH)

  const currentDark = readJson(DARK_THEME_PATH)
  const baselineDark = readJson(TEMPLATE_DARK_PATH)
  const warnings = []

  warnTemplateDrift(currentDark, baselineDark, warnings)

  for (const variantMeta of VARIANT_CONFIG) {
    validateTemplateAvailability(variantMeta.templatePath)
    const baselineVariant = readJson(variantMeta.templatePath)
    const generated = buildVariantTheme(currentDark, baselineDark, baselineVariant, variantMeta, warnings)
    const changed = writeJson(variantMeta.outputPath, generated)
    console.log(`${changed ? '✓ generated' : '- unchanged'} ${variantMeta.outputPath} from ${DARK_THEME_PATH}`)
  }

  if (warnings.length > 0) {
    console.log('\n[WARN] Variant generator fallbacks:')
    for (const warning of warnings) {
      console.log(`  - ${warning}`)
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    generateThemeVariants()
  } catch (error) {
    console.error(`[FAIL] ${error.message}`)
    process.exit(1)
  }
}
