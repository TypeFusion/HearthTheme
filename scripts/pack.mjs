import { execSync } from 'child_process'
import { chdir } from 'process'

console.log('🔄 Syncing themes...')
execSync('node scripts/sync-themes.mjs', { stdio: 'inherit' })

console.log('📦 Packaging extension...')
chdir('extension')
execSync('npx vsce package --no-dependencies --skip-license', { stdio: 'inherit' })

console.log('✅ Done!')