import { execSync } from 'node:child_process'

const PREVIEW_PATHS = [
  'extension/images',
  'public/previews',
]

function run(command, options = {}) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  })
}

function shellEscape(value) {
  if (/^[A-Za-z0-9._/:-]+$/.test(value)) return value
  return `"${value.replace(/"/g, '\\"')}"`
}

function listChanged(paths) {
  const targetArgs = paths.map(shellEscape).join(' ')
  const output = run(`git diff --name-only -- ${targetArgs}`)
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function listUntracked(paths) {
  const targetArgs = paths.map(shellEscape).join(' ')
  const output = run(`git ls-files --others --exclude-standard -- ${targetArgs}`)
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function toSet(items) {
  return new Set(items.map((item) => item.trim()).filter(Boolean))
}

function difference(left, right) {
  const out = []
  for (const item of left) {
    if (!right.has(item)) out.push(item)
  }
  return out.sort()
}

function main() {
  const before = toSet([...listChanged(PREVIEW_PATHS), ...listUntracked(PREVIEW_PATHS)])

  process.stdout.write('[preview-check] Running preview generation...\n')
  execSync('node scripts/generate-preview-images.mjs', { stdio: 'inherit' })

  const after = toSet([...listChanged(PREVIEW_PATHS), ...listUntracked(PREVIEW_PATHS)])
  const introduced = difference(after, before)

  if (introduced.length > 0) {
    process.stderr.write('\n[preview-check] Preview assets drift detected after generation.\n')
    process.stderr.write('[preview-check] Stage/update these files before committing:\n')
    for (const file of introduced) {
      process.stderr.write(`  - ${file}\n`)
    }
    process.stderr.write('\nRun: pnpm run preview:generate && git add <files> && commit again.\n')
    process.exit(1)
  }

  process.stdout.write('[preview-check] OK: preview assets are in sync.\n')
}

main()
