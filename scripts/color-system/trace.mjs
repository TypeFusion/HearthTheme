import { getExportedSiteTokenKeys } from './build.mjs'

const OBSIDIAN_THEME_PATHS = {
  dark: 'obsidian/themes/hearth-dark.css',
  darkSoft: 'obsidian/themes/hearth-dark-soft.css',
  light: 'obsidian/themes/hearth-light.css',
  lightSoft: 'obsidian/themes/hearth-light-soft.css',
}

function buildRoleIndex(adapters) {
  return new Map(adapters.map((role) => [role.id, role]))
}

function pushIndexed(indexes, entry) {
  indexes.byArtifactId[entry.id] = entry
  if (!indexes.byPath[entry.path]) indexes.byPath[entry.path] = []
  indexes.byPath[entry.path].push(entry.id)
  if (!indexes.byVariant[entry.variant]) indexes.byVariant[entry.variant] = []
  indexes.byVariant[entry.variant].push(entry.id)
  if (entry.roleId) {
    if (!indexes.byRole[entry.roleId]) indexes.byRole[entry.roleId] = []
    indexes.byRole[entry.roleId].push(entry.id)
  }
  if (entry.familyId) {
    if (!indexes.byFamily[entry.familyId]) indexes.byFamily[entry.familyId] = []
    indexes.byFamily[entry.familyId].push(entry.id)
  }
}

function buildArtifactChain(baseChain, resolvedColor, outputColor) {
  if (!outputColor || outputColor === resolvedColor) return baseChain
  return [...baseChain, 'scripts/generate-theme-variants.mjs#postprocess']
}

function buildSurfaceEntries(model, artifactMaps, indexes) {
  const entries = []

  for (const variant of model.variants.variants) {
    for (const contract of model.surfaceAdapters) {
      const resolved = model.surfaceRules.resolved[contract.id][variant.id]
      const resolvedColor = resolved.color
      const sourceId = resolved.family || `surface:${contract.id}`

      if (contract.webToken) {
        const outputColor = artifactMaps.web?.[variant.id]?.[contract.webToken] ?? model.platformTokenMaps.web[variant.id][contract.webToken]
        const entry = {
          id: `web-surface:${contract.id}:${variant.id}`,
          path: 'src/data/tokens.ts',
          field: `tokens.${variant.id}.${contract.webToken}`,
          artifactType: 'webToken',
          adapter: 'web',
          variant: variant.id,
          roleId: null,
          familyId: sourceId,
          resolvedColor: outputColor,
          chainRefs: buildArtifactChain([...resolved.chainRefs, `adapters.surfaces.${contract.id}`], resolvedColor, outputColor),
        }
        entries.push(entry)
        pushIndexed(indexes, entry)
      }

      if (contract.vscodeColor) {
        const outputColor = artifactMaps.vscode?.workbench?.[variant.id]?.[contract.vscodeColor] ?? model.platformTokenMaps.vscode.workbench[variant.id][contract.vscodeColor]
        const entry = {
          id: `vscode-surface:${contract.id}:${variant.id}`,
          path: variant.outputPath,
          field: `colors.${contract.vscodeColor}`,
          artifactType: 'vscodeWorkbench',
          adapter: 'vscode',
          variant: variant.id,
          roleId: null,
          familyId: sourceId,
          resolvedColor: outputColor,
          chainRefs: buildArtifactChain([...resolved.chainRefs, `adapters.surfaces.${contract.id}`], resolvedColor, outputColor),
        }
        entries.push(entry)
        pushIndexed(indexes, entry)
      }

      if (contract.obsidianVar) {
        const outputColor = artifactMaps.obsidian?.[variant.id]?.[contract.obsidianVar] ?? model.platformTokenMaps.obsidian[variant.id][contract.obsidianVar]
        const entry = {
          id: `obsidian-surface:${contract.id}:${variant.id}`,
          path: OBSIDIAN_THEME_PATHS[variant.id],
          field: contract.obsidianVar,
          artifactType: 'obsidianVar',
          adapter: 'obsidian',
          variant: variant.id,
          roleId: null,
          familyId: sourceId,
          resolvedColor: outputColor,
          chainRefs: [...resolved.chainRefs, `adapters.surfaces.${contract.id}`],
        }
        entries.push(entry)
        pushIndexed(indexes, entry)
      }
    }
  }

  return entries
}

function buildInteractionEntries(model, artifactMaps, indexes) {
  const entries = []

  for (const variant of model.variants.variants) {
    for (const contract of model.interactionAdapters) {
      const resolved = model.interactionRules.interactions[contract.id].resolved[variant.id]
      const resolvedColor = resolved.color
      const sourceId = resolved.family || `interaction:${contract.id}`

      if (contract.webToken) {
        const outputColor = artifactMaps.web?.[variant.id]?.[contract.webToken] ?? model.platformTokenMaps.web[variant.id][contract.webToken]
        const entry = {
          id: `web-interaction:${contract.id}:${variant.id}`,
          path: 'src/data/tokens.ts',
          field: `tokens.${variant.id}.${contract.webToken}`,
          artifactType: 'webToken',
          adapter: 'web',
          variant: variant.id,
          roleId: null,
          familyId: sourceId,
          resolvedColor: outputColor,
          chainRefs: buildArtifactChain([...resolved.chainRefs, `adapters.interactions.${contract.id}`], resolvedColor, outputColor),
        }
        entries.push(entry)
        pushIndexed(indexes, entry)
      }

      if (contract.vscodeColor) {
        const outputColor = artifactMaps.vscode?.workbench?.[variant.id]?.[contract.vscodeColor] ?? model.platformTokenMaps.vscode.workbench[variant.id][contract.vscodeColor]
        const entry = {
          id: `vscode-interaction:${contract.id}:${variant.id}`,
          path: variant.outputPath,
          field: `colors.${contract.vscodeColor}`,
          artifactType: 'vscodeWorkbench',
          adapter: 'vscode',
          variant: variant.id,
          roleId: null,
          familyId: sourceId,
          resolvedColor: outputColor,
          chainRefs: buildArtifactChain([...resolved.chainRefs, `adapters.interactions.${contract.id}`], resolvedColor, outputColor),
        }
        entries.push(entry)
        pushIndexed(indexes, entry)
      }

      if (contract.obsidianVar) {
        const outputColor = artifactMaps.obsidian?.[variant.id]?.[contract.obsidianVar] ?? model.platformTokenMaps.obsidian[variant.id][contract.obsidianVar]
        const entry = {
          id: `obsidian-interaction:${contract.id}:${variant.id}`,
          path: OBSIDIAN_THEME_PATHS[variant.id],
          field: contract.obsidianVar,
          artifactType: 'obsidianVar',
          adapter: 'obsidian',
          variant: variant.id,
          roleId: null,
          familyId: sourceId,
          resolvedColor: outputColor,
          chainRefs: [...resolved.chainRefs, `adapters.interactions.${contract.id}`],
        }
        entries.push(entry)
        pushIndexed(indexes, entry)
      }
    }
  }

  return entries
}

function buildRoleEntries(model, artifactMaps, indexes) {
  const entries = []
  const siteKeys = new Set(getExportedSiteTokenKeys())
  const roleIndex = buildRoleIndex(model.adapters)

  for (const roleId of Object.keys(model.semanticPalette)) {
    const roleDef = roleIndex.get(roleId)
    if (!roleDef) continue
    const webTokenKey = roleDef.webToken || roleId
    for (const variant of model.variants.variants) {
      const resolved = model.resolvedSemantic[roleId][variant.id]
      const baseChain = [
        `foundation.families.${resolved.family}.tones.${resolved.tone}.${variant.id}`,
        `semantic-rules.roles.${roleId}`,
        `variant-profiles.variants.${variant.id}`,
      ]

      const semanticSnapshotEntry = {
        id: `semantic-snapshot:${roleId}:${variant.id}`,
        path: model.sources.semanticSnapshot,
        field: `roles.${roleId}.${variant.id}`,
        artifactType: 'semanticSnapshot',
        adapter: null,
        variant: variant.id,
        roleId,
        familyId: resolved.family,
        resolvedColor: resolved.color,
        chainRefs: baseChain,
        usedEscapeHatch: resolved.usedEscapeHatch,
      }
      entries.push(semanticSnapshotEntry)
      pushIndexed(indexes, semanticSnapshotEntry)

      if (siteKeys.has(webTokenKey)) {
        const outputColor = artifactMaps.web?.[variant.id]?.[webTokenKey] ?? model.platformTokenMaps.web[variant.id][webTokenKey]
        const webEntry = {
          id: `web-role:${roleId}:${variant.id}`,
          path: 'src/data/tokens.ts',
          field: `tokens.${variant.id}.${webTokenKey}`,
          artifactType: 'webToken',
          adapter: 'web',
          variant: variant.id,
          roleId,
          familyId: resolved.family,
          resolvedColor: outputColor,
          chainRefs: buildArtifactChain([...baseChain, `adapters.roles.${roleId}`], resolved.color, outputColor),
        }
        entries.push(webEntry)
        pushIndexed(indexes, webEntry)
      }

      if (roleDef.vscodeSemantic) {
        const outputColor =
          artifactMaps.vscode?.semantic?.[variant.id]?.[roleDef.vscodeSemantic]
          ?? model.platformTokenMaps.vscode.semantic[variant.id][roleDef.vscodeSemantic]
        const semanticEntry = {
          id: `vscode-semantic:${roleId}:${variant.id}`,
          path: variant.outputPath,
          field: `semanticTokenColors.${roleDef.vscodeSemantic}`,
          artifactType: 'vscodeSemantic',
          adapter: 'vscode',
          variant: variant.id,
          roleId,
          familyId: resolved.family,
          resolvedColor: outputColor,
          chainRefs: buildArtifactChain([...baseChain, `adapters.roles.${roleId}`], resolved.color, outputColor),
        }
        entries.push(semanticEntry)
        pushIndexed(indexes, semanticEntry)
      }

      if (roleDef.scopes?.length) {
        const outputColor =
          artifactMaps.vscode?.textmate?.[variant.id]?.[roleId]?.color
          ?? model.platformTokenMaps.vscode.textmate[variant.id]?.[roleId]?.color
          ?? resolved.color
        const textmateEntry = {
          id: `vscode-textmate:${roleId}:${variant.id}`,
          path: variant.outputPath,
          field: `tokenColors[${roleId}]`,
          artifactType: 'vscodeTextMate',
          adapter: 'vscode',
          variant: variant.id,
          roleId,
          familyId: resolved.family,
          resolvedColor: outputColor,
          chainRefs: buildArtifactChain([...baseChain, `adapters.roles.${roleId}`], resolved.color, outputColor),
          scopes: roleDef.scopes,
        }
        entries.push(textmateEntry)
        pushIndexed(indexes, textmateEntry)
      }

      if (roleDef.obsidianVar) {
        const outputColor = artifactMaps.obsidian?.[variant.id]?.[roleDef.obsidianVar] ?? model.platformTokenMaps.obsidian[variant.id][roleDef.obsidianVar]
        const obsidianEntry = {
          id: `obsidian-role:${roleId}:${variant.id}`,
          path: OBSIDIAN_THEME_PATHS[variant.id],
          field: roleDef.obsidianVar,
          artifactType: 'obsidianVar',
          adapter: 'obsidian',
          variant: variant.id,
          roleId,
          familyId: resolved.family,
          resolvedColor: outputColor,
          chainRefs: [...baseChain, `adapters.roles.${roleId}`],
        }
        entries.push(obsidianEntry)
        pushIndexed(indexes, obsidianEntry)
      }
    }
  }

  return entries
}

export function buildColorLanguageLineage(model, artifactMaps = model.platformTokenMaps) {
  const indexes = {
    byArtifactId: {},
    byPath: {},
    byVariant: {},
    byRole: {},
    byFamily: {},
  }

  const artifactEntries = [
    ...buildSurfaceEntries(model, artifactMaps, indexes),
    ...buildInteractionEntries(model, artifactMaps, indexes),
    ...buildRoleEntries(model, artifactMaps, indexes),
  ]

  const roles = {}
  for (const [roleId, variants] of Object.entries(model.resolvedSemantic)) {
    const first = variants[Object.keys(variants)[0]]
    roles[roleId] = {
      source: {
        family: first.family,
        tone: first.tone,
      },
      flags: model.semanticRules.roles[roleId].flags,
      variants: Object.fromEntries(
        Object.entries(variants).map(([variantId, entry]) => [
          variantId,
          {
            color: entry.color,
            family: entry.family,
            tone: entry.tone,
            usedEscapeHatch: entry.usedEscapeHatch,
            steps: entry.steps,
          },
        ])
      ),
    }
  }

  return {
    schemaVersion: 3,
    sources: model.sources,
    scheme: {
      id: model.scheme.id,
      name: model.scheme.name,
      headline: model.scheme.headline,
      summary: model.scheme.summary,
      defaultVariant: model.scheme.defaultVariant,
    },
    foundation: {
      families: Object.fromEntries(
        Object.entries(model.foundation.families).map(([familyId, family]) => [
          familyId,
          {
            description: family.description,
            tones: family.tones,
          },
        ])
      ),
    },
    surfaceRules: Object.fromEntries(
      Object.entries(model.surfaceRules.surfaces).map(([surfaceId, values]) => [
        surfaceId,
        {
          description: model.surfaceRules.definitions[surfaceId]?.description || '',
          values,
          variants: Object.fromEntries(
            Object.entries(model.surfaceRules.resolved[surfaceId]).map(([variantId, entry]) => [
              variantId,
              {
                color: entry.color,
                sourceType: entry.sourceType,
                sourceRef: entry.sourceRef,
                usedEscapeHatch: entry.usedEscapeHatch,
                chainRefs: entry.chainRefs,
                steps: entry.steps,
              },
            ])
          ),
        },
      ])
    ),
    interactionRules: Object.fromEntries(
      Object.entries(model.interactionRules.interactions).map(([interactionId, entry]) => [
        interactionId,
        {
          description: entry.description,
          values: entry.values,
          variants: Object.fromEntries(
            Object.entries(entry.resolved).map(([variantId, resolved]) => [
              variantId,
              {
                color: resolved.color,
                sourceType: resolved.sourceType,
                sourceRef: resolved.sourceRef,
                usedEscapeHatch: resolved.usedEscapeHatch,
                chainRefs: resolved.chainRefs,
                steps: resolved.steps,
              },
            ])
          ),
        },
      ])
    ),
    variantProfiles: model.variantProfiles.variants,
    roles,
    artifactEntries,
    indexes,
  }
}
