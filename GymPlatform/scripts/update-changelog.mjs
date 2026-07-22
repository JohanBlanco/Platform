#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const changelogPath = join(__dirname, '..', 'docs', 'wiki', 'Changelog.md')

function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8', cwd: join(__dirname, '..') })
  return r.status === 0 ? r.stdout.trim() : null
}

const hash = git(['rev-parse', 'HEAD'])
const subject = git(['log', '-1', '--pretty=%s'])
const date = git(['log', '-1', '--pretty=%ci'])

if (!hash || !subject) {
  console.log('ℹ Sin commits git; changelog no modificado')
  process.exit(0)
}

if (!existsSync(changelogPath)) {
  console.warn('⚠ Changelog no encontrado')
  process.exit(0)
}

const marker = `<!-- AUTO:${hash} -->`
let content = readFileSync(changelogPath, 'utf8')

if (content.includes(marker)) {
  console.log('ℹ Changelog ya tiene esta entrada')
  process.exit(0)
}

const entry = `
${marker}
## ${date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)} — ${subject}

_Auto-sync desde commit \`${hash.slice(0, 7)}\`_

### Docs actualizados automáticamente
- [x] Timestamps wiki
- [x] Changelog
${process.env.SKIP_OPENAPI ? '' : '- [x] API Reference (si --full)'}

---
`

const insertAfter = '# Changelog de desarrollo\n\nBitácora de cambios. Actualizar en cada sesión de trabajo.\n\n---\n'
if (content.includes(insertAfter)) {
  content = content.replace(insertAfter, insertAfter + entry)
} else {
  content = entry + content
}

writeFileSync(changelogPath, content)
console.log(`✓ Changelog: entrada para "${subject}"`)
