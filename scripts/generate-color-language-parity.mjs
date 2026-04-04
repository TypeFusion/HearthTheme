import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { buildColorLanguageModel } from './color-system/build.mjs'
import { buildGeneratedPlatformTokenMaps } from './color-system/artifacts.mjs'
import { buildColorLanguageParity } from './color-system/parity.mjs'

const OUTPUT_PATH = 'reports/color-language-parity.json'

function writeIfChanged(path, content) {
  if (existsSync(path)) {
    const prev = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
    const next = content.replace(/\r\n/g, '\n')
    if (prev === next) return false
  }
  writeFileSync(path, content)
  return true
}

export function generateColorLanguageParity() {
  const model = buildColorLanguageModel()
  const artifactMaps = buildGeneratedPlatformTokenMaps(model)
  const parity = buildColorLanguageParity(model, artifactMaps)

  mkdirSync('reports', { recursive: true })
  const changed = writeIfChanged(OUTPUT_PATH, `${JSON.stringify(parity, null, 2)}\n`)
  console.log(`${changed ? '✓ updated' : '- unchanged'} ${OUTPUT_PATH}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    generateColorLanguageParity()
  } catch (error) {
    console.error(`[FAIL] ${error.message}`)
    process.exit(1)
  }
}
