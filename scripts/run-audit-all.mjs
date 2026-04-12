import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { REPO_ROOT } from './paths.mjs'

const PNPM_BIN = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const ROOT_PACKAGE_JSON_PATH = new URL('../package.json', import.meta.url)
const PACKAGE_MANIFEST = JSON.parse(readFileSync(ROOT_PACKAGE_JSON_PATH, 'utf8'))
const AVAILABLE_SCRIPTS = new Set(Object.keys(PACKAGE_MANIFEST.scripts || {}))

const SEQUENTIAL_SCRIPTS = [
  'validate:schemas',
  'audit:theme',
  'audit:source-layer',
  'check:schemes',
]

const CONCURRENT_SCRIPTS = [
  'audit:contracts',
  'audit:contract-review',
  'audit:compatibility',
  'audit:lineage',
  'audit:parity',
  'audit:obsidian',
  'audit:copy',
  'audit:claims',
  'audit:cjk',
  'audit:release',
]

function formatDuration(durationMs) {
  if (durationMs < 1000) return `${durationMs}ms`
  return `${(durationMs / 1000).toFixed(2)}s`
}

function divider(label) {
  return `\n=== ${label} ===`
}

function printScriptOutput(result) {
  const trimmed = `${result.stdout}${result.stderr}`.trim()
  if (!trimmed) return
  console.log(divider(result.script))
  console.log(trimmed)
}

function summarizeStatus(result) {
  const label = result.status.toUpperCase().padEnd(7, ' ')
  return `[${label}] ${result.script} (${formatDuration(result.durationMs)})`
}

function runScript(script) {
  if (!AVAILABLE_SCRIPTS.has(script)) {
    return Promise.resolve({
      script,
      status: 'skipped',
      durationMs: 0,
      stdout: '',
      stderr: 'script is not defined in package.json',
      exitCode: null,
    })
  }

  return new Promise((resolve) => {
    const startedAt = Date.now()
    const isWindows = process.platform === 'win32'
    const command = isWindows ? process.env.ComSpec || 'cmd.exe' : PNPM_BIN
    const args = isWindows ? ['/d', '/s', '/c', `pnpm run ${script}`] : ['run', script]

    const child = spawn(command, args, {
      cwd: REPO_ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', (error) => {
      resolve({
        script,
        status: 'failed',
        durationMs: Date.now() - startedAt,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        exitCode: 1,
      })
    })

    child.on('close', (exitCode) => {
      resolve({
        script,
        status: exitCode === 0 ? 'passed' : 'failed',
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
        exitCode,
      })
    })
  })
}

async function runGroup(scripts, mode) {
  if (mode === 'sequential') {
    const results = []
    for (const script of scripts) {
      const result = await runScript(script)
      results.push(result)
      printScriptOutput(result)
      console.log(summarizeStatus(result))
    }
    return results
  }

  const results = await Promise.all(scripts.map((script) => runScript(script)))
  for (const script of scripts) {
    const result = results.find((entry) => entry.script === script)
    printScriptOutput(result)
    console.log(summarizeStatus(result))
  }
  return results
}

async function main() {
  const sequentialResults = await runGroup(SEQUENTIAL_SCRIPTS, 'sequential')
  const concurrentResults = await runGroup(CONCURRENT_SCRIPTS, 'concurrent')
  const allResults = [...sequentialResults, ...concurrentResults]

  const total = allResults.length
  const passed = allResults.filter((result) => result.status === 'passed').length
  const failed = allResults.filter((result) => result.status === 'failed').length
  const skipped = allResults.filter((result) => result.status === 'skipped').length

  console.log('\n=== Audit Summary ===')
  for (const result of allResults) {
    console.log(summarizeStatus(result))
  }
  console.log(`Total: ${total}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${skipped}`)

  process.exit(failed > 0 ? 1 : 0)
}

await main()
