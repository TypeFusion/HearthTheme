import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'

export const THEME_FILES = {
  dark: 'themes/hearth-dark.json',
  darkSoft: 'themes/hearth-dark-soft.json',
  light: 'themes/hearth-light.json',
  lightSoft: 'themes/hearth-light-soft.json',
}

export const VARIANT_META = {
  dark: {
    label: 'Hearth Dark (Obsidian)',
    cssFile: 'hearth-dark.css',
    modeClass: '.theme-dark',
  },
  darkSoft: {
    label: 'Hearth Dark Soft (Obsidian)',
    cssFile: 'hearth-dark-soft.css',
    modeClass: '.theme-dark',
  },
  light: {
    label: 'Hearth Light (Obsidian)',
    cssFile: 'hearth-light.css',
    modeClass: '.theme-light',
  },
  lightSoft: {
    label: 'Hearth Light Soft (Obsidian)',
    cssFile: 'hearth-light-soft.css',
    modeClass: '.theme-light',
  },
}

const OUTPUT_DIR = 'obsidian/themes'

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function writeIfChanged(path, content) {
  if (existsSync(path)) {
    const prev = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
    const next = content.replace(/\r\n/g, '\n')
    if (prev === next) return false
  }
  writeFileSync(path, content)
  return true
}

function normalizeHex(hex) {
  if (typeof hex !== 'string') return null
  const value = hex.trim().toLowerCase()
  if (/^#[0-9a-f]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
  }
  if (/^#[0-9a-f]{6}$/.test(value)) return value
  if (/^#[0-9a-f]{8}$/.test(value)) return value.slice(0, 7)
  return null
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex)
  if (!normalized) throw new Error(`Invalid hex: ${hex}`)
  const raw = normalized.slice(1)
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16),
  ]
}

function toHexByte(value) {
  return Math.round(Math.min(Math.max(value, 0), 255)).toString(16).padStart(2, '0')
}

function rgbToHex([r, g, b]) {
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`
}

function mixHex(a, b, t) {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const ratio = Math.min(Math.max(t, 0), 1)
  return rgbToHex([
    ar + (br - ar) * ratio,
    ag + (bg - ag) * ratio,
    ab + (bb - ab) * ratio,
  ])
}

function alpha(hex, value) {
  const [r, g, b] = hexToRgb(hex)
  const v = Number(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
  return `rgb(${r} ${g} ${b} / ${v})`
}

function getToken(theme, scopes) {
  for (const scope of scopes) {
    const hit = (theme.tokenColors || []).find((entry) => (
      Array.isArray(entry.scope) ? entry.scope.includes(scope) : entry.scope === scope
    ))
    if (hit?.settings?.foreground) {
      const value = normalizeHex(hit.settings.foreground)
      if (value) return value
    }
  }
  return null
}

function extractThemeTokens(theme) {
  return {
    bg: normalizeHex(theme.colors?.['editor.background']),
    fg: normalizeHex(theme.colors?.['editor.foreground']),
    lineBg: normalizeHex(theme.colors?.['editor.lineHighlightBackground']),
    lineNo: normalizeHex(theme.colors?.['editorLineNumber.foreground']),
    sidebar: normalizeHex(theme.colors?.['sideBar.background']),
    border: normalizeHex(theme.colors?.['sideBar.border']),
    selection: normalizeHex(theme.colors?.['editor.selectionBackground']),
    cursor: normalizeHex(theme.colors?.['editorCursor.foreground']),
    keyword: getToken(theme, ['keyword']),
    operator: getToken(theme, ['keyword.operator']),
    fn: getToken(theme, ['entity.name.function']),
    string: getToken(theme, ['string']),
    number: getToken(theme, ['constant.numeric']),
    type: getToken(theme, ['entity.name.type']),
    variable: getToken(theme, ['variable']),
    property: getToken(theme, ['variable.other.property', 'meta.object-literal.key']),
    comment: getToken(theme, ['comment']),
    tag: getToken(theme, ['entity.name.tag']),
  }
}

function assertTokenSet(id, tokenSet) {
  for (const [key, value] of Object.entries(tokenSet)) {
    if (!value) {
      throw new Error(`Missing required token \"${id}.${key}\" while generating Obsidian themes.`)
    }
  }
}

function buildVars(tokens) {
  const accent = tokens.cursor
  const accentHover = mixHex(accent, tokens.fg, 0.18)
  const bgSecondary = mixHex(tokens.sidebar, tokens.bg, 0.5)
  const bgSecondaryAlt = mixHex(tokens.lineBg, tokens.bg, 0.4)

  return {
    '--background-primary': tokens.bg,
    '--background-primary-alt': tokens.lineBg,
    '--background-secondary': bgSecondary,
    '--background-secondary-alt': bgSecondaryAlt,
    '--background-modifier-border': alpha(tokens.border, 0.72),
    '--background-modifier-form-field': alpha(tokens.border, 0.22),
    '--background-modifier-hover': alpha(tokens.border, 0.28),
    '--background-modifier-active-hover': alpha(accent, 0.26),
    '--background-modifier-box-shadow': alpha(tokens.bg, 0.6),
    '--background-modifier-success': alpha(tokens.string, 0.24),
    '--background-modifier-error': alpha(tokens.keyword, 0.2),
    '--background-modifier-error-hover': alpha(tokens.keyword, 0.3),
    '--background-modifier-cover': alpha(tokens.bg, 0.72),
    '--text-normal': tokens.fg,
    '--text-muted': mixHex(tokens.comment, tokens.fg, 0.36),
    '--text-faint': mixHex(tokens.comment, tokens.bg, 0.28),
    '--text-accent': accent,
    '--text-accent-hover': accentHover,
    '--text-highlight-bg': alpha(tokens.selection, 0.34),
    '--text-selection': alpha(tokens.selection, 0.42),
    '--interactive-normal': alpha(tokens.border, 0.2),
    '--interactive-hover': alpha(tokens.border, 0.3),
    '--interactive-accent': accent,
    '--interactive-accent-hover': accentHover,
    '--scrollbar-bg': alpha(tokens.bg, 0.24),
    '--scrollbar-thumb-bg': alpha(tokens.border, 0.5),
    '--scrollbar-active-thumb-bg': alpha(tokens.border, 0.72),
    '--link-color': accent,
    '--link-color-hover': accentHover,
    '--code-normal': tokens.variable,
    '--code-comment': tokens.comment,
    '--code-function': tokens.fn,
    '--code-keyword': tokens.keyword,
    '--code-operator': tokens.operator,
    '--code-property': tokens.property,
    '--code-string': tokens.string,
    '--code-tag': tokens.tag,
    '--code-value': tokens.number,
    '--code-important': tokens.type,
  }
}

function renderVars(modeClass, vars) {
  const lines = [`${modeClass} {`]
  for (const key of Object.keys(vars).sort()) {
    lines.push(`  ${key}: ${vars[key]};`)
  }
  lines.push('}', '')
  return lines.join('\n')
}

function renderSyntaxSelectors(modeClass) {
  return `${modeClass} .cm-s-obsidian span.cm-comment,
${modeClass} .markdown-source-view.mod-cm6 .cm-line .cm-comment {
  color: var(--code-comment);
  font-style: italic;
}

${modeClass} .cm-s-obsidian span.cm-keyword,
${modeClass} .markdown-source-view.mod-cm6 .cm-line .cm-keyword {
  color: var(--code-keyword);
}

${modeClass} .cm-s-obsidian span.cm-operator,
${modeClass} .markdown-source-view.mod-cm6 .cm-line .cm-operator {
  color: var(--code-operator);
}

${modeClass} .cm-s-obsidian span.cm-string,
${modeClass} .markdown-source-view.mod-cm6 .cm-line .cm-string {
  color: var(--code-string);
}

${modeClass} .cm-s-obsidian span.cm-number,
${modeClass} .markdown-source-view.mod-cm6 .cm-line .cm-number {
  color: var(--code-value);
}

${modeClass} .cm-s-obsidian span.cm-def,
${modeClass} .markdown-source-view.mod-cm6 .cm-line .cm-def,
${modeClass} .markdown-source-view.mod-cm6 .cm-line .cm-variable-2 {
  color: var(--code-function);
}

${modeClass} .cm-s-obsidian span.cm-variable,
${modeClass} .markdown-source-view.mod-cm6 .cm-line .cm-variable {
  color: var(--code-normal);
}

${modeClass} .cm-s-obsidian span.cm-property,
${modeClass} .markdown-source-view.mod-cm6 .cm-line .cm-property {
  color: var(--code-property);
}

${modeClass} .cm-s-obsidian span.cm-type,
${modeClass} .markdown-source-view.mod-cm6 .cm-line .cm-type {
  color: var(--code-important);
}

${modeClass} .cm-s-obsidian span.cm-tag,
${modeClass} .markdown-source-view.mod-cm6 .cm-line .cm-tag {
  color: var(--code-tag);
}

${modeClass} .markdown-preview-view pre code .hljs-comment {
  color: var(--code-comment);
}

${modeClass} .markdown-preview-view pre code .hljs-keyword,
${modeClass} .markdown-preview-view pre code .hljs-selector-tag {
  color: var(--code-keyword);
}

${modeClass} .markdown-preview-view pre code .hljs-string,
${modeClass} .markdown-preview-view pre code .hljs-title {
  color: var(--code-string);
}

${modeClass} .markdown-preview-view pre code .hljs-number,
${modeClass} .markdown-preview-view pre code .hljs-literal {
  color: var(--code-value);
}
`
}

function renderThemeCss(meta, themePath, vars) {
  const header = [
    '/* Auto-generated by scripts/generate-obsidian-themes.mjs - DO NOT EDIT */',
    `/* Variant: ${meta.label} */`,
    `/* Source: ${themePath} */`,
    '',
  ]

  return `${header.join('\n')}${renderVars(meta.modeClass, vars)}${renderSyntaxSelectors(meta.modeClass)}`
}

export function buildVariantCssById(id) {
  const path = THEME_FILES[id]
  const meta = VARIANT_META[id]
  if (!path || !meta) throw new Error(`Unknown Obsidian variant id: ${id}`)

  const theme = readJson(path)
  const tokens = extractThemeTokens(theme)
  assertTokenSet(id, tokens)
  const vars = buildVars(tokens)
  return renderThemeCss(meta, path, vars)
}

export function generateObsidianThemes() {
  mkdirSync(OUTPUT_DIR, { recursive: true })

  let changed = 0
  for (const id of Object.keys(THEME_FILES)) {
    const meta = VARIANT_META[id]
    const css = buildVariantCssById(id)
    const outPath = `${OUTPUT_DIR}/${meta.cssFile}`
    const didChange = writeIfChanged(outPath, css)
    if (didChange) changed += 1
    console.log(`${didChange ? '✓ updated' : '- unchanged'} ${outPath}`)
  }

  return changed
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    generateObsidianThemes()
  } catch (error) {
    console.error(`[FAIL] ${error.message}`)
    process.exit(1)
  }
}
