import { deltaE, hexToRgba, normalizeHex } from '../color-utils.mjs'

const DEFAULT_THRESHOLDS = {
  deltaE: 2,
  alpha: 0.08,
}

function normalizeColorMap(platforms) {
  return Object.fromEntries(
    Object.entries(platforms)
      .map(([platform, color]) => [platform, normalizeHex(color)])
      .filter(([, color]) => Boolean(color))
  )
}

function countTargets(entries, pickTarget) {
  const counts = new Map()
  for (const entry of entries) {
    const target = pickTarget(entry)
    if (!target) continue
    counts.set(target, (counts.get(target) || 0) + 1)
  }
  return counts
}

function buildParityTargetCounts(entries, fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([label, pickTarget]) => [label, countTargets(entries, pickTarget)])
  )
}

function comparePlatforms(platforms, thresholds) {
  const entries = Object.entries(normalizeColorMap(platforms))
  const comparisons = []
  const issues = []
  let maxDeltaE = 0
  let maxAlphaDelta = 0

  for (let index = 0; index < entries.length; index += 1) {
    const [platformA, colorA] = entries[index]
    const rgbaA = hexToRgba(colorA)
    for (let inner = index + 1; inner < entries.length; inner += 1) {
      const [platformB, colorB] = entries[inner]
      const rgbaB = hexToRgba(colorB)
      const pairDeltaE = deltaE(colorA, colorB) ?? 0
      const alphaDelta = rgbaA && rgbaB ? Math.abs((rgbaA.a / 255) - (rgbaB.a / 255)) : 0
      maxDeltaE = Math.max(maxDeltaE, pairDeltaE)
      maxAlphaDelta = Math.max(maxAlphaDelta, alphaDelta)

      const comparison = {
        pair: [platformA, platformB],
        colors: [colorA, colorB],
        deltaE: Number(pairDeltaE.toFixed(2)),
        alphaDelta: Number(alphaDelta.toFixed(3)),
      }
      comparisons.push(comparison)

      if (pairDeltaE > thresholds.deltaE || alphaDelta > thresholds.alpha) {
        issues.push(comparison)
      }
    }
  }

  return {
    platforms: Object.fromEntries(entries),
    comparisons,
    maxDeltaE: Number(maxDeltaE.toFixed(2)),
    maxAlphaDelta: Number(maxAlphaDelta.toFixed(3)),
    issues,
  }
}

function buildRolePlatforms(artifactMaps, roleDef, variantId, targetCounts) {
  const platforms = {}
  const omittedPlatforms = []
  const webKey = roleDef.webToken || roleDef.id
  if (webKey) {
    if ((targetCounts.web.get(webKey) || 0) > 1) omittedPlatforms.push(`web:${webKey}`)
    else platforms.web = artifactMaps.web?.[variantId]?.[webKey] ?? null
  }
  if (roleDef.obsidianVar) {
    if ((targetCounts.obsidian.get(roleDef.obsidianVar) || 0) > 1) omittedPlatforms.push(`obsidian:${roleDef.obsidianVar}`)
    else platforms.obsidian = artifactMaps.obsidian?.[variantId]?.[roleDef.obsidianVar] ?? null
  }
  if (roleDef.vscodeSemantic) {
    if ((targetCounts.vscodeSemantic.get(roleDef.vscodeSemantic) || 0) > 1) {
      omittedPlatforms.push(`vscode.semantic:${roleDef.vscodeSemantic}`)
    } else {
      platforms['vscode.semantic'] = artifactMaps.vscode?.semantic?.[variantId]?.[roleDef.vscodeSemantic] ?? null
    }
  }
  if (roleDef.scopes?.length) {
    platforms['vscode.textmate'] = artifactMaps.vscode?.textmate?.[variantId]?.[roleDef.id]?.color ?? null
  }
  return { platforms, omittedPlatforms }
}

function buildContractPlatforms(artifactMaps, contract, variantId, targetCounts) {
  const platforms = {}
  const omittedPlatforms = []
  if (contract.webToken) {
    if ((targetCounts.web.get(contract.webToken) || 0) > 1) omittedPlatforms.push(`web:${contract.webToken}`)
    else platforms.web = artifactMaps.web?.[variantId]?.[contract.webToken] ?? null
  }
  if (contract.obsidianVar) {
    if ((targetCounts.obsidian.get(contract.obsidianVar) || 0) > 1) omittedPlatforms.push(`obsidian:${contract.obsidianVar}`)
    else platforms.obsidian = artifactMaps.obsidian?.[variantId]?.[contract.obsidianVar] ?? null
  }
  if (contract.vscodeColor) {
    if ((targetCounts.vscode.get(contract.vscodeColor) || 0) > 1) omittedPlatforms.push(`vscode:${contract.vscodeColor}`)
    else platforms.vscode = artifactMaps.vscode?.workbench?.[variantId]?.[contract.vscodeColor] ?? null
  }
  return { platforms, omittedPlatforms }
}

function buildCategoryParity({ entries, variants, getPlatforms, include, targetCounts }) {
  const report = {}
  const summary = {
    checked: 0,
    withComparisons: 0,
    issueCount: 0,
  }

  for (const entry of entries) {
    if (!include(entry)) continue
    report[entry.id] = {
      description: entry.description ?? null,
      variants: {},
    }
    for (const variant of variants) {
      const platformState = getPlatforms(entry, variant.id, targetCounts)
      const parity = comparePlatforms(platformState.platforms, DEFAULT_THRESHOLDS)
      parity.omittedPlatforms = platformState.omittedPlatforms
      report[entry.id].variants[variant.id] = parity
      summary.checked += 1
      if (Object.keys(parity.platforms).length >= 2) {
        summary.withComparisons += 1
      }
      summary.issueCount += parity.issues.length
    }
  }

  return { report, summary }
}

export function buildColorLanguageParity(model, artifactMaps) {
  const roleTargetCounts = buildParityTargetCounts(model.adapters, {
    web: (entry) => entry.webToken || entry.id,
    obsidian: (entry) => entry.obsidianVar,
    vscodeSemantic: (entry) => entry.vscodeSemantic,
  })

  const roleParity = buildCategoryParity({
    entries: model.adapters,
    variants: model.variants.variants,
    getPlatforms: buildRolePlatforms.bind(null, artifactMaps),
    include: (entry) => entry.includeInReport !== false,
    targetCounts: roleTargetCounts,
  })

  const surfaceTargetCounts = buildParityTargetCounts(model.surfaceAdapters, {
    web: (entry) => entry.webToken,
    obsidian: (entry) => entry.obsidianVar,
    vscode: (entry) => entry.vscodeColor,
  })

  const surfaceParity = buildCategoryParity({
    entries: model.surfaceAdapters,
    variants: model.variants.variants,
    getPlatforms: buildContractPlatforms.bind(null, artifactMaps),
    include: (entry) => entry.includeInReport !== false,
    targetCounts: surfaceTargetCounts,
  })

  const guidanceTargetCounts = buildParityTargetCounts(model.guidanceAdapters, {
    web: (entry) => entry.webToken,
    obsidian: (entry) => entry.obsidianVar,
    vscode: (entry) => entry.vscodeColor,
  })

  const guidanceParity = buildCategoryParity({
    entries: model.guidanceAdapters,
    variants: model.variants.variants,
    getPlatforms: buildContractPlatforms.bind(null, artifactMaps),
    include: (entry) => entry.includeInReport !== false,
    targetCounts: guidanceTargetCounts,
  })

  const interfaceTargetCounts = buildParityTargetCounts(model.interfaceAdapters, {
    web: (entry) => entry.webToken,
    obsidian: (entry) => entry.obsidianVar,
    vscode: (entry) => entry.vscodeColor,
  })

  const interfaceParity = buildCategoryParity({
    entries: model.interfaceAdapters,
    variants: model.variants.variants,
    getPlatforms: buildContractPlatforms.bind(null, artifactMaps),
    include: (entry) => entry.includeInReport !== false,
    targetCounts: interfaceTargetCounts,
  })

  const interactionTargetCounts = buildParityTargetCounts(model.interactionAdapters, {
    web: (entry) => entry.webToken,
    obsidian: (entry) => entry.obsidianVar,
    vscode: (entry) => entry.vscodeColor,
  })

  const interactionParity = buildCategoryParity({
    entries: model.interactionAdapters,
    variants: model.variants.variants,
    getPlatforms: buildContractPlatforms.bind(null, artifactMaps),
    include: (entry) => entry.includeInReport !== false,
    targetCounts: interactionTargetCounts,
  })

  const feedbackTargetCounts = buildParityTargetCounts(model.feedbackAdapters, {
    web: (entry) => entry.webToken,
    obsidian: (entry) => entry.obsidianVar,
    vscode: (entry) => entry.vscodeColor,
  })

  const feedbackParity = buildCategoryParity({
    entries: model.feedbackAdapters,
    variants: model.variants.variants,
    getPlatforms: buildContractPlatforms.bind(null, artifactMaps),
    include: (entry) => entry.includeInReport !== false,
    targetCounts: feedbackTargetCounts,
  })

  const totalIssueCount =
    roleParity.summary.issueCount
    + surfaceParity.summary.issueCount
    + guidanceParity.summary.issueCount
    + interfaceParity.summary.issueCount
    + interactionParity.summary.issueCount
    + feedbackParity.summary.issueCount

  return {
    schemaVersion: 3,
    scheme: {
      id: model.scheme.id,
      name: model.scheme.name,
    },
    thresholds: DEFAULT_THRESHOLDS,
    summary: {
      issueCount: totalIssueCount,
      roles: roleParity.summary,
      surfaces: surfaceParity.summary,
      guidances: guidanceParity.summary,
      interfaces: interfaceParity.summary,
      interactions: interactionParity.summary,
      feedbacks: feedbackParity.summary,
    },
    roles: roleParity.report,
    surfaces: surfaceParity.report,
    guidances: guidanceParity.report,
    interfaces: interfaceParity.report,
    interactions: interactionParity.report,
    feedbacks: feedbackParity.report,
  }
}
