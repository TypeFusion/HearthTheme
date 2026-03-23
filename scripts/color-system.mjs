import { readFileSync } from 'fs'

export const COLOR_SYSTEM_VARIANTS_PATH = 'color-system/variants.json'
export const COLOR_SYSTEM_ADAPTERS_PATH = 'color-system/adapters.json'
export const COLOR_SYSTEM_SEMANTIC_PATH = 'color-system/semantic.json'

const HEX_RE = /^#[0-9a-f]{6}$/i

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function normalizeHex(hex) {
  if (typeof hex !== 'string') return null
  const value = hex.trim().toLowerCase()
  if (!HEX_RE.test(value)) return null
  return value
}

export function loadColorSystemVariants() {
  const data = readJson(COLOR_SYSTEM_VARIANTS_PATH)
  assert(data && typeof data === 'object' && !Array.isArray(data), `${COLOR_SYSTEM_VARIANTS_PATH} must be an object`)
  assert(typeof data.baseSourcePath === 'string' && data.baseSourcePath.length > 0, `${COLOR_SYSTEM_VARIANTS_PATH}: missing baseSourcePath`)
  assert(typeof data.baseTemplatePath === 'string' && data.baseTemplatePath.length > 0, `${COLOR_SYSTEM_VARIANTS_PATH}: missing baseTemplatePath`)
  assert(Array.isArray(data.variants) && data.variants.length > 0, `${COLOR_SYSTEM_VARIANTS_PATH}: variants must be a non-empty array`)

  const ids = new Set()
  for (const variant of data.variants) {
    assert(variant && typeof variant === 'object', `${COLOR_SYSTEM_VARIANTS_PATH}: invalid variant entry`)
    assert(typeof variant.id === 'string' && variant.id.length > 0, `${COLOR_SYSTEM_VARIANTS_PATH}: variant.id is required`)
    assert(!ids.has(variant.id), `${COLOR_SYSTEM_VARIANTS_PATH}: duplicate variant id "${variant.id}"`)
    ids.add(variant.id)
    assert(typeof variant.name === 'string' && variant.name.length > 0, `${COLOR_SYSTEM_VARIANTS_PATH}: variant "${variant.id}" missing name`)
    assert(variant.type === 'dark' || variant.type === 'light', `${COLOR_SYSTEM_VARIANTS_PATH}: variant "${variant.id}" has invalid type`)
    assert(variant.mode === 'source' || variant.mode === 'derived', `${COLOR_SYSTEM_VARIANTS_PATH}: variant "${variant.id}" has invalid mode`)
    assert(typeof variant.outputPath === 'string' && variant.outputPath.length > 0, `${COLOR_SYSTEM_VARIANTS_PATH}: variant "${variant.id}" missing outputPath`)
    if (variant.mode === 'derived') {
      assert(typeof variant.templatePath === 'string' && variant.templatePath.length > 0, `${COLOR_SYSTEM_VARIANTS_PATH}: derived variant "${variant.id}" missing templatePath`)
    }
  }

  return data
}

export function getThemeOutputFiles() {
  const variants = loadColorSystemVariants().variants
  return Object.fromEntries(variants.map((variant) => [variant.id, variant.outputPath]))
}

export function getThemeMetaList() {
  const variants = loadColorSystemVariants().variants
  return variants.map((variant) => ({
    id: variant.id,
    path: variant.outputPath,
    type: variant.type,
  }))
}

export function loadRoleAdapters() {
  const data = readJson(COLOR_SYSTEM_ADAPTERS_PATH)
  assert(data && typeof data === 'object' && !Array.isArray(data), `${COLOR_SYSTEM_ADAPTERS_PATH} must be an object`)
  assert(Array.isArray(data.roles) && data.roles.length > 0, `${COLOR_SYSTEM_ADAPTERS_PATH}: roles must be a non-empty array`)

  const ids = new Set()
  const roles = data.roles.map((role) => {
    assert(role && typeof role === 'object', `${COLOR_SYSTEM_ADAPTERS_PATH}: invalid role entry`)
    const id = String(role.id || '').trim()
    assert(id, `${COLOR_SYSTEM_ADAPTERS_PATH}: role.id is required`)
    assert(!ids.has(id), `${COLOR_SYSTEM_ADAPTERS_PATH}: duplicate role id "${id}"`)
    ids.add(id)

    const scopes = Array.isArray(role.scopes) ? role.scopes.map((item) => String(item || '').trim()).filter(Boolean) : []
    const semanticKeys = Array.isArray(role.semanticKeys)
      ? role.semanticKeys.map((item) => String(item || '').trim()).filter(Boolean)
      : []

    return {
      id,
      scopes,
      semanticKeys,
      vscodeSemantic: role.vscodeSemantic == null ? null : String(role.vscodeSemantic).trim() || null,
      obsidianVar: role.obsidianVar == null ? null : String(role.obsidianVar).trim() || null,
      webToken: role.webToken == null ? null : String(role.webToken).trim() || null,
      includeInReport: Boolean(role.includeInReport),
      requireTokenCoverage: role.requireTokenCoverage !== false,
    }
  })

  return roles
}

export function loadSemanticPalette() {
  const variants = loadColorSystemVariants().variants
  const variantIds = variants.map((variant) => variant.id)
  const roleIds = new Set(loadRoleAdapters().map((role) => role.id))

  const data = readJson(COLOR_SYSTEM_SEMANTIC_PATH)
  assert(data && typeof data === 'object' && !Array.isArray(data), `${COLOR_SYSTEM_SEMANTIC_PATH} must be an object`)
  assert(data.roles && typeof data.roles === 'object' && !Array.isArray(data.roles), `${COLOR_SYSTEM_SEMANTIC_PATH}: roles must be an object`)

  const palette = {}

  for (const [roleId, valueByVariant] of Object.entries(data.roles)) {
    assert(roleIds.has(roleId), `${COLOR_SYSTEM_SEMANTIC_PATH}: unknown role "${roleId}"`)
    assert(valueByVariant && typeof valueByVariant === 'object' && !Array.isArray(valueByVariant), `${COLOR_SYSTEM_SEMANTIC_PATH}: role "${roleId}" must map to an object`)
    palette[roleId] = {}

    for (const variantId of variantIds) {
      const color = normalizeHex(valueByVariant[variantId])
      assert(color, `${COLOR_SYSTEM_SEMANTIC_PATH}: role "${roleId}" missing valid color for variant "${variantId}"`)
      palette[roleId][variantId] = color
    }
  }

  return palette
}
