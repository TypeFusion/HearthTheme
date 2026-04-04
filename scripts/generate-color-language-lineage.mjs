import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { buildColorLanguageModel } from './color-system/build.mjs'
import { buildGeneratedPlatformTokenMaps } from './color-system/artifacts.mjs'
import { buildColorLanguageLineage } from './color-system/trace.mjs'

const OUTPUT_PATH = 'reports/color-language-lineage.json'

function writeIfChanged(path, content) {
  if (existsSync(path)) {
    const prev = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
    const next = content.replace(/\r\n/g, '\n')
    if (prev === next) return false
  }
  writeFileSync(path, content)
  return true
}

export function generateColorLanguageLineage() {
  const model = buildColorLanguageModel()
  const artifactMaps = buildGeneratedPlatformTokenMaps(model)
  const lineage = buildColorLanguageLineage(model, artifactMaps)

  mkdirSync('reports', { recursive: true })
  const changed = writeIfChanged(OUTPUT_PATH, `${JSON.stringify(lineage, null, 2)}\n`)
  console.log(`${changed ? '✓ updated' : '- unchanged'} ${OUTPUT_PATH}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    generateColorLanguageLineage()
  } catch (error) {
    console.error(`[FAIL] ${error.message}`)
    process.exit(1)
  }
}
