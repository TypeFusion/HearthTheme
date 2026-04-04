import { readFileSync } from 'fs'
import { buildColorLanguageModel } from './color-system/build.mjs'
import { buildGeneratedPlatformTokenMaps } from './color-system/artifacts.mjs'
import { buildColorLanguageLineage } from './color-system/trace.mjs'

const REPORT_PATH = 'reports/color-language-lineage.json'

function fail(message) {
  console.error(`[FAIL] ${message}`)
  process.exit(1)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function assert(condition, message) {
  if (!condition) fail(message)
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
  const expected = buildColorLanguageLineage(model, artifactMaps)
  const reportJson = JSON.stringify(report)
  const expectedJson = JSON.stringify(expected)
  if (reportJson !== expectedJson) {
    fail(`Lineage report is out of sync with source inputs. Run: pnpm run sync`)
  }

  assert(Array.isArray(report.artifactEntries), `${REPORT_PATH}: artifactEntries must be an array`)
  assert(report.artifactEntries.length > 0, `${REPORT_PATH}: artifactEntries must not be empty`)
  assert(report.indexes && typeof report.indexes === 'object', `${REPORT_PATH}: indexes must be an object`)

  const artifactIds = new Set()
  for (const entry of report.artifactEntries) {
    assert(typeof entry.id === 'string' && entry.id.length > 0, `${REPORT_PATH}: artifact entry missing id`)
    assert(!artifactIds.has(entry.id), `${REPORT_PATH}: duplicate artifact id "${entry.id}"`)
    artifactIds.add(entry.id)
    assert(typeof entry.path === 'string' && entry.path.length > 0, `${REPORT_PATH}: artifact "${entry.id}" missing path`)
    assert(typeof entry.variant === 'string' && entry.variant.length > 0, `${REPORT_PATH}: artifact "${entry.id}" missing variant`)
    assert(typeof entry.resolvedColor === 'string' && entry.resolvedColor.length > 0, `${REPORT_PATH}: artifact "${entry.id}" missing resolvedColor`)
    assert(Array.isArray(entry.chainRefs) && entry.chainRefs.length > 0, `${REPORT_PATH}: artifact "${entry.id}" missing chainRefs`)
  }

  for (const [indexName, value] of Object.entries(report.indexes)) {
    assert(value && typeof value === 'object' && !Array.isArray(value), `${REPORT_PATH}: indexes.${indexName} must be an object`)
    for (const [bucket, ids] of Object.entries(value)) {
      if (indexName === 'byArtifactId') {
        assert(ids && typeof ids === 'object', `${REPORT_PATH}: indexes.byArtifactId.${bucket} must be an object`)
        continue
      }
      assert(Array.isArray(ids), `${REPORT_PATH}: indexes.${indexName}.${bucket} must be an array`)
      for (const id of ids) {
        assert(artifactIds.has(id), `${REPORT_PATH}: indexes.${indexName}.${bucket} references unknown artifact "${id}"`)
      }
    }
  }

  const expectedRoles = new Set(model.adapters.map((role) => role.id))
  for (const roleId of expectedRoles) {
    assert(report.roles?.[roleId], `${REPORT_PATH}: missing role lineage for "${roleId}"`)
    for (const variant of model.variants.variants) {
      const variantEntry = report.roles[roleId].variants?.[variant.id]
      assert(variantEntry, `${REPORT_PATH}: missing variant lineage for role "${roleId}" / "${variant.id}"`)
    }
  }

  const expectedInterfaces = new Set(model.interfaceAdapters.map((entry) => entry.id))
  for (const interfaceId of expectedInterfaces) {
    assert(report.interfaces?.[interfaceId], `${REPORT_PATH}: missing interface lineage for "${interfaceId}"`)
    for (const variant of model.variants.variants) {
      const variantEntry = report.interfaces[interfaceId].variants?.[variant.id]
      assert(variantEntry, `${REPORT_PATH}: missing variant lineage for interface "${interfaceId}" / "${variant.id}"`)
    }
  }

  const expectedGuidances = new Set(model.guidanceAdapters.map((entry) => entry.id))
  for (const guidanceId of expectedGuidances) {
    assert(report.guidances?.[guidanceId], `${REPORT_PATH}: missing guidance lineage for "${guidanceId}"`)
    for (const variant of model.variants.variants) {
      const variantEntry = report.guidances[guidanceId].variants?.[variant.id]
      assert(variantEntry, `${REPORT_PATH}: missing variant lineage for guidance "${guidanceId}" / "${variant.id}"`)
    }
  }

  const expectedTerminals = new Set(model.terminalAdapters.map((entry) => entry.id))
  for (const terminalId of expectedTerminals) {
    assert(report.terminals?.[terminalId], `${REPORT_PATH}: missing terminal lineage for "${terminalId}"`)
    for (const variant of model.variants.variants) {
      const variantEntry = report.terminals[terminalId].variants?.[variant.id]
      assert(variantEntry, `${REPORT_PATH}: missing variant lineage for terminal "${terminalId}" / "${variant.id}"`)
    }
  }

  console.log('[PASS] Lineage audit passed.')
}

main()
