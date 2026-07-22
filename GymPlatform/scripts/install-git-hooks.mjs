#!/usr/bin/env node
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const hooksDir = join(ROOT, '.githooks')
const postCommit = join(hooksDir, 'post-commit')

mkdirSync(hooksDir, { recursive: true })

const hookContent = `#!/bin/sh
# Post-commit desactivado — sync de docs solo manual (npm run docs:sync:full)
exit 0
`

writeFileSync(postCommit, hookContent)
chmodSync(postCommit, 0o755)

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  cwd: ROOT,
  stdio: 'inherit',
})

if (result.status === 0) {
  console.log('✓ Git hooks instalados (.githooks/post-commit)')
  console.log('  Sync de docs desactivado en post-commit (manual: npm run docs:sync:full)')
} else {
  console.warn('⚠ No se pudo configurar core.hooksPath (¿es un repo git?)')
  console.log('  Hook creado en .githooks/post-commit — configura manualmente:')
  console.log('  git config core.hooksPath .githooks')
}
