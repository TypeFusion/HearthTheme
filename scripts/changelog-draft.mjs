import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'

const ROLE_SCOPES = {
  comment: ['comment', 'punctuation.definition.comment'],
  keyword: ['keyword', 'keyword.control'],
  operator: ['keyword.operator', 'keyword.operator.assignment'],
  function: ['entity.name.function', 'support.function'],
  string: ['string', 'string.quoted', 'string.template'],
  number: ['constant.numeric'],
  type: ['entity.name.type', 'entity.name.class', 'support.type'],
  variable: ['variable', 'variable.other.readwrite'],
  property: ['variable.other.property', 'support.type.property-name'],
}

const SURFACE_KEYS = [
  'editor.background',
  'editor.foreground',
  'editor.lineHighlightBackground',
  'editor.selectionBackground',
  'statusBar.background',
  'sideBar.background',
  'panel.background',
  'tab.activeBackground',
  'terminal.background',
  'focusBorder',
]

const ROLE_LABEL = {
  en: {
    comment: 'comment',
    keyword: 'keyword',
    operator: 'operator',
    function: 'function',
    string: 'string',
    number: 'number',
    type: 'type',
    variable: 'variable',
    property: 'property',
  },
  zh: {
    comment: '注释',
    keyword: '关键字',
    operator: '操作符',
    function: '函数',
    string: '字符串',
    number: '数字',
    type: '类型',
    variable: '变量',
    property: '属性',
  },
  ja: {
    comment: 'コメント',
    keyword: 'キーワード',
    operator: '演算子',
    function: '関数',
    string: '文字列',
    number: '数値',
    type: '型',
    variable: '変数',
    property: 'プロパティ',
  },
}

const SURFACE_LABEL = {
  en: {
    'editor.background': 'editor.background',
    'editor.foreground': 'editor.foreground',
    'editor.lineHighlightBackground': 'editor.lineHighlightBackground',
    'editor.selectionBackground': 'editor.selectionBackground',
    'statusBar.background': 'statusBar.background',
    'sideBar.background': 'sideBar.background',
    'panel.background': 'panel.background',
    'tab.activeBackground': 'tab.activeBackground',
    'terminal.background': 'terminal.background',
    'focusBorder': 'focusBorder',
  },
  zh: {
    'editor.background': '编辑器背景',
    'editor.foreground': '编辑器前景',
    'editor.lineHighlightBackground': '当前行背景',
    'editor.selectionBackground': '选区背景',
    'statusBar.background': '状态栏背景',
    'sideBar.background': '侧栏背景',
    'panel.background': '面板背景',
    'tab.activeBackground': '活动标签背景',
    'terminal.background': '终端背景',
    'focusBorder': '焦点边框',
  },
  ja: {
    'editor.background': 'エディタ背景',
    'editor.foreground': 'エディタ前景',
    'editor.lineHighlightBackground': '行ハイライト背景',
    'editor.selectionBackground': '選択背景',
    'statusBar.background': 'ステータスバー背景',
    'sideBar.background': 'サイドバー背景',
    'panel.background': 'パネル背景',
    'tab.activeBackground': 'アクティブタブ背景',
    'terminal.background': 'ターミナル背景',
    'focusBorder': 'フォーカス枠',
  },
}

function getArg(name, fallback = null) {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`))
  if (inline) return inline.slice(name.length + 1)
  const idx = process.argv.indexOf(name)
  if (idx === -1) return fallback
  return process.argv[idx + 1] ?? fallback
}

function getNpmConfig(name) {
  const key = `npm_config_${name.replace(/^--/, '').replace(/-/g, '_')}`
  return process.env[key] ?? null
}

function looksLikeVersion(value) {
  return /^v?\d+\.\d+\.\d+(?:[-+][0-9a-z.-]+)?$/i.test(value)
}

function normalizeVersion(value) {
  if (!value) return null
  return value.startsWith('v') ? value : `v${value}`
}

function hasFlag(name) {
  return process.argv.includes(name)
}

const positionalVersion = process.argv
  .slice(2)
  .find((arg) => !arg.startsWith('-') && looksLikeVersion(arg))

const fromRef = getArg('--from', getNpmConfig('--from') ?? 'HEAD')
const toRef = getArg('--to', getNpmConfig('--to') ?? 'WORKTREE')
const appendMode = hasFlag('--append')
const version = normalizeVersion(
  getArg('--ver', getArg('--version', getNpmConfig('--ver') ?? getNpmConfig('--version') ?? positionalVersion ?? 'v0.x.x')),
)
const date = getArg('--date', getNpmConfig('--date') ?? new Date().toISOString().slice(0, 10))
const outFile = getArg('--out', getNpmConfig('--out') ?? 'src/data/themeChangelog.ts')

if (hasFlag('--help')) {
  console.log(`Usage:
  node scripts/changelog-draft.mjs [--from <git-ref>] [--to <git-ref|WORKTREE>]
                                  [--ver <vX.Y.Z>|--version <vX.Y.Z>|<vX.Y.Z>] [--date <YYYY-MM-DD>]
                                  [--append] [--out <path>]

Examples:
  node scripts/changelog-draft.mjs
  node scripts/changelog-draft.mjs --from HEAD~1 --to HEAD --ver v0.4.3
  node scripts/changelog-draft.mjs --append v0.4.3
  npm run changelog:append -- v0.4.3`)
  process.exit(0)
}

function normalizeHex(hex) {
  if (typeof hex !== 'string') return null
  const value = hex.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(value)) return value
  if (/^#[0-9a-f]{8}$/.test(value)) return value.slice(0, 7)
  return null
}

function readThemeFromDisk(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function readThemeFromGit(ref, path) {
  try {
    const posixPath = path.replace(/\\/g, '/')
    const content = execSync(`git show ${ref}:${posixPath}`, { encoding: 'utf8' })
    return JSON.parse(content)
  } catch {
    return null
  }
}

function readTheme(ref, path) {
  if (ref === 'WORKTREE') return readThemeFromDisk(path)
  return readThemeFromGit(ref, path)
}

function toScopes(entry) {
  if (!entry?.scope) return []
  return Array.isArray(entry.scope) ? entry.scope : [entry.scope]
}

function getTokenColor(theme, scopes) {
  for (const entry of theme.tokenColors || []) {
    const entryScopes = toScopes(entry)
    const hit = scopes.some((scope) => entryScopes.includes(scope))
    if (hit && entry.settings?.foreground) return normalizeHex(entry.settings.foreground)
  }
  return null
}

function hexToRgb(hex) {
  const raw = hex.slice(1)
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

function contrastRatio(a, b) {
  const [ar, ag, ab] = hexToRgb(a).map(toLinear)
  const [br, bg, bb] = hexToRgb(b).map(toLinear)
  const la = 0.2126 * ar + 0.7152 * ag + 0.0722 * ab
  const lb = 0.2126 * br + 0.7152 * bg + 0.0722 * bb
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return ((hi + 0.05) / (lo + 0.05)).toFixed(1)
}

function listWithLimit(items, limit = 5) {
  if (items.length <= limit) return items.join(', ')
  const head = items.slice(0, limit).join(', ')
  return `${head} +${items.length - limit}`
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeTsString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function indentBlock(text, indent) {
  return text
    .split('\n')
    .map((line) => `${indent}${line}`)
    .join('\n')
}

function makeTitle(modeScope, roleScope, surfaceCount) {
  if (surfaceCount >= 4 && modeScope === 'both') {
    return {
      en: 'Cross-mode material refinement',
      zh: '跨模式材质层优化',
      ja: 'クロスモード素材レイヤー調整',
    }
  }
  if (roleScope.has('comment') || roleScope.has('operator')) {
    return {
      en: 'Long-session noise tuning',
      zh: '长时编码降噪微调',
      ja: '長時間作業向けノイズ調整',
    }
  }
  return {
    en: 'Syntax palette refinement',
    zh: '语法配色精修',
    ja: 'シンタックス配色の微調整',
  }
}

function makeSummary(modeScope) {
  if (modeScope === 'both') {
    return {
      en: 'Refined dark and light themes with consistent role semantics and calmer visual rhythm.',
      zh: '对深浅主题进行同步精修，在保持语义一致的前提下让视觉节奏更平稳。',
      ja: 'ダーク/ライトを同時調整し、役割整合性を維持したまま視覚リズムを安定化。',
    }
  }
  if (modeScope === 'dark') {
    return {
      en: 'Refined the dark theme while preserving blackboard material language.',
      zh: '在保持黑板语义的前提下，精修了深色主题。',
      ja: '黒板語彙を保ちながらダークテーマを精修。',
    }
  }
  return {
    en: 'Refined the light theme while preserving parchment material language.',
    zh: '在保持羊皮纸语义的前提下，精修了浅色主题。',
    ja: '羊皮紙語彙を保ちながらライトテーマを精修。',
  }
}

function buildBulletLines(diffByMode, contrastByMode) {
  const lines = { en: [], zh: [], ja: [] }

  for (const mode of ['dark', 'light']) {
    const changedRoles = diffByMode[mode].roles
    if (changedRoles.length > 0) {
      lines.en.push(`Updated ${mode} syntax roles: ${listWithLimit(changedRoles.map((r) => ROLE_LABEL.en[r]))}.`)
      lines.zh.push(`更新${mode === 'dark' ? '深色' : '浅色'}语法角色：${listWithLimit(changedRoles.map((r) => ROLE_LABEL.zh[r]))}。`)
      lines.ja.push(`${mode === 'dark' ? 'ダーク' : 'ライト'}の役割を更新: ${listWithLimit(changedRoles.map((r) => ROLE_LABEL.ja[r]))}。`)
    }

    const changedSurfaces = diffByMode[mode].surfaces
    if (changedSurfaces.length > 0) {
      lines.en.push(`Adjusted ${mode} UI surfaces: ${listWithLimit(changedSurfaces.map((k) => SURFACE_LABEL.en[k]))}.`)
      lines.zh.push(`调整${mode === 'dark' ? '深色' : '浅色'}界面层：${listWithLimit(changedSurfaces.map((k) => SURFACE_LABEL.zh[k]))}。`)
      lines.ja.push(`${mode === 'dark' ? 'ダーク' : 'ライト'}のUI層を調整: ${listWithLimit(changedSurfaces.map((k) => SURFACE_LABEL.ja[k]))}。`)
    }

    const contrast = contrastByMode[mode]
    if (contrast.changed) {
      lines.en.push(`Editor contrast (${mode}) changed ${contrast.before} -> ${contrast.after}.`)
      lines.zh.push(`编辑器对比度（${mode === 'dark' ? '深色' : '浅色'}）从 ${contrast.before} 调整到 ${contrast.after}。`)
      lines.ja.push(`エディタコントラスト（${mode === 'dark' ? 'ダーク' : 'ライト'}）: ${contrast.before} -> ${contrast.after}。`)
    }
  }

  if (lines.en.length === 0) {
    lines.en.push('No theme-role changes were detected; verify compare range.')
    lines.zh.push('未检测到主题角色变更，请确认对比范围。')
    lines.ja.push('テーマ役割の変更は検出されませんでした。比較範囲を確認してください。')
  }

  return {
    en: lines.en.slice(0, 5),
    zh: lines.zh.slice(0, 5),
    ja: lines.ja.slice(0, 5),
  }
}

function compareThemes(baseTheme, nextTheme) {
  const roleChanges = []
  for (const [role, scopes] of Object.entries(ROLE_SCOPES)) {
    const before = getTokenColor(baseTheme, scopes)
    const after = getTokenColor(nextTheme, scopes)
    if (before && after && before !== after) roleChanges.push(role)
  }

  const surfaceChanges = []
  for (const key of SURFACE_KEYS) {
    const before = normalizeHex(baseTheme.colors?.[key])
    const after = normalizeHex(nextTheme.colors?.[key])
    if (before && after && before !== after) surfaceChanges.push(key)
  }

  return { roleChanges, surfaceChanges }
}

function renderEntry(payload) {
  return `{
\tdate: "${escapeTsString(payload.date)}",
\tversion: "${escapeTsString(payload.version)}",
\ttitle: {
\t\ten: "${escapeTsString(payload.title.en)}",
\t\tzh: "${escapeTsString(payload.title.zh)}",
\t\tja: "${escapeTsString(payload.title.ja)}",
\t},
\tsummary: {
\t\ten: "${escapeTsString(payload.summary.en)}",
\t\tzh: "${escapeTsString(payload.summary.zh)}",
\t\tja: "${escapeTsString(payload.summary.ja)}",
\t},
\tchanges: {
\t\ten: [
${payload.changes.en.map((line) => `\t\t\t"${escapeTsString(line)}"`).join(',\n')}
\t\t],
\t\tzh: [
${payload.changes.zh.map((line) => `\t\t\t"${escapeTsString(line)}"`).join(',\n')}
\t\t],
\t\tja: [
${payload.changes.ja.map((line) => `\t\t\t"${escapeTsString(line)}"`).join(',\n')}
\t\t],
\t},
},`
}

function appendEntryToChangelog(entry, filePath, versionTag) {
  let text
  try {
    text = readFileSync(filePath, 'utf8')
  } catch (error) {
    console.error(`[ERROR] Unable to read changelog file: ${filePath}`)
    console.error(`Reason: ${error.message}`)
    process.exit(1)
  }
  const marker = 'export const themeChangelog: ThemeChangeEntry[] = ['
  const markerIndex = text.indexOf(marker)

  if (markerIndex === -1) {
    console.error(`[ERROR] Could not find changelog array marker in ${filePath}`)
    process.exit(1)
  }

  if (versionTag !== 'v0.x.x') {
    const versionRegex = new RegExp(`version:\\s*"${escapeRegex(versionTag)}"`)
    if (versionRegex.test(text)) {
      console.error(`[ERROR] Version "${versionTag}" already exists in ${filePath}`)
      process.exit(1)
    }
  }

  const newline = text.includes('\r\n') ? '\r\n' : '\n'
  const insertPos = markerIndex + marker.length
  const insertion = `${newline}${indentBlock(entry, '\t')}`
  const output = text.slice(0, insertPos) + insertion + text.slice(insertPos)
  try {
    writeFileSync(filePath, output)
  } catch (error) {
    console.error(`[ERROR] Failed to write changelog file: ${filePath}`)
    console.error(`Reason: ${error.message}`)
    process.exit(1)
  }
}

function buildDraft() {
  const darkPath = 'themes/hearth-dark.json'
  const lightPath = 'themes/hearth-light.json'

  const darkBefore = readTheme(fromRef, darkPath)
  const darkAfter = readTheme(toRef, darkPath)
  const lightBefore = readTheme(fromRef, lightPath)
  const lightAfter = readTheme(toRef, lightPath)

  if (!darkBefore || !darkAfter || !lightBefore || !lightAfter) {
    console.error('[ERROR] Failed to load theme files for the selected compare range.')
    console.error(`from=${fromRef} to=${toRef}`)
    process.exit(1)
  }

  const darkDiff = compareThemes(darkBefore, darkAfter)
  const lightDiff = compareThemes(lightBefore, lightAfter)

  const changedModes = []
  if (darkDiff.roleChanges.length + darkDiff.surfaceChanges.length > 0) changedModes.push('dark')
  if (lightDiff.roleChanges.length + lightDiff.surfaceChanges.length > 0) changedModes.push('light')
  const modeScope = changedModes.length === 2 ? 'both' : changedModes[0] ?? 'both'

  const roleScope = new Set([...darkDiff.roleChanges, ...lightDiff.roleChanges])
  const surfaceCount = darkDiff.surfaceChanges.length + lightDiff.surfaceChanges.length

  const contrastByMode = {
    dark: {
      before: contrastRatio(darkBefore.colors['editor.foreground'], darkBefore.colors['editor.background']),
      after: contrastRatio(darkAfter.colors['editor.foreground'], darkAfter.colors['editor.background']),
    },
    light: {
      before: contrastRatio(lightBefore.colors['editor.foreground'], lightBefore.colors['editor.background']),
      after: contrastRatio(lightAfter.colors['editor.foreground'], lightAfter.colors['editor.background']),
    },
  }
  contrastByMode.dark.changed = contrastByMode.dark.before !== contrastByMode.dark.after
  contrastByMode.light.changed = contrastByMode.light.before !== contrastByMode.light.after

  const title = makeTitle(modeScope, roleScope, surfaceCount)
  const summary = makeSummary(modeScope)
  const changes = buildBulletLines(
    { dark: { roles: darkDiff.roleChanges, surfaces: darkDiff.surfaceChanges }, light: { roles: lightDiff.roleChanges, surfaces: lightDiff.surfaceChanges } },
    contrastByMode,
  )

  const entry = renderEntry({
    date,
    version,
    title,
    summary,
    changes,
  })

  console.log('--- Theme Changelog Draft ---')
  console.log(`Compare range: ${fromRef} -> ${toRef}`)
  console.log('')
  console.log(entry)
  console.log('')

  if (appendMode) {
    if (version === 'v0.x.x') {
      console.error('[ERROR] Append mode requires a real version tag (for example: npm run changelog:append -- v0.4.3).')
      process.exit(1)
    }
    appendEntryToChangelog(entry, outFile, version)
    console.log(`[OK] Appended entry to ${outFile}`)
  } else {
    console.log('Tip: paste this entry into src/data/themeChangelog.ts (top of array).')
    console.log(`Tip: use --append --ver <vX.Y.Z> (or positional vX.Y.Z) to insert automatically.`)
  }
}

buildDraft()
