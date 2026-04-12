import Ajv from 'ajv'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { repoPath, resolveRepoPath } from './paths.mjs'

const SCHEMA_DIR = repoPath('color-system', 'schemas')
const TARGETS = [
  {
    file: repoPath('color-system', 'semantic.json'),
    schema: repoPath(SCHEMA_DIR, 'semantic.schema.json'),
  },
  {
    file: repoPath('color-system', 'framework', 'adapters.json'),
    schema: repoPath(SCHEMA_DIR, 'adapters.schema.json'),
  },
  {
    file: repoPath('color-system', 'framework', 'variants.json'),
    schema: repoPath(SCHEMA_DIR, 'variants.schema.json'),
  },
  {
    file: repoPath('color-system', 'framework', 'tuning.json'),
    schema: repoPath(SCHEMA_DIR, 'tuning.schema.json'),
  },
]

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolveRepoPath(relativePath), 'utf8'))
}

function formatError(error) {
  const instancePath = error.instancePath || '/'
  const missingProperty = error.params?.missingProperty
  const extra = missingProperty ? ` (${missingProperty})` : ''
  return `${instancePath} ${error.message}${extra}`
}

function main() {
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
  })

  ajv.addSchema(readJson(repoPath(SCHEMA_DIR, 'common.schema.json')))

  let failed = false

  for (const target of TARGETS) {
    const data = readJson(target.file)
    const schema = readJson(target.schema)
    const validate = ajv.compile(schema)
    const valid = validate(data)

    if (valid) {
      console.log(`[PASS] ${target.file} matches ${target.schema}`)
      continue
    }

    failed = true
    console.error(`[FAIL] ${target.file} does not match ${target.schema}`)
    for (const error of validate.errors || []) {
      console.error(`  - ${formatError(error)}`)
    }
  }

  if (failed) {
    process.exit(1)
  }

  console.log(`[PASS] Color-system schema validation passed (${TARGETS.length} files).`)
}

main()
