#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const openApiPath = join(ROOT, 'docs', 'openapi.json')
const wikiPath = join(ROOT, 'docs', 'wiki', 'API-Reference.md')

const START = '<!-- AUTO-GENERATED:START -->'
const END = '<!-- AUTO-GENERATED:END -->'

if (!existsSync(openApiPath)) {
  console.warn('⚠ docs/openapi.json no existe; ejecuta npm run docs:export-openapi')
  process.exit(0)
}

const spec = JSON.parse(readFileSync(openApiPath, 'utf8'))
const paths = spec.paths ?? {}
const tags = spec.tags ?? []

const byTag = new Map()

for (const [path, methods] of Object.entries(paths)) {
  for (const [method, op] of Object.entries(methods)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue
    const tag = (op.tags?.[0] ?? 'Otros')
    if (!byTag.has(tag)) byTag.set(tag, [])
    byTag.get(tag).push({
      method: method.toUpperCase(),
      path,
      summary: op.summary ?? op.operationId ?? '',
    })
  }
}

let generated = `\n_Generado automáticamente el ${new Date().toISOString().slice(0, 10)} desde \`docs/openapi.json\`_\n\n`

for (const tag of tags.map(t => t.name)) {
  const endpoints = byTag.get(tag)
  if (!endpoints?.length) continue
  generated += `### ${tag}\n\n`
  generated += '| Método | Ruta | Descripción |\n|--------|------|-------------|\n'
  for (const ep of endpoints.sort((a, b) => a.path.localeCompare(b.path))) {
    generated += `| ${ep.method} | \`${ep.path}\` | ${ep.summary} |\n`
  }
  generated += '\n'
}

// Tags no declarados en spec.tags
for (const [tag, endpoints] of byTag) {
  if (tags.some(t => t.name === tag)) continue
  generated += `### ${tag}\n\n`
  generated += '| Método | Ruta | Descripción |\n|--------|------|-------------|\n'
  for (const ep of endpoints.sort((a, b) => a.path.localeCompare(b.path))) {
    generated += `| ${ep.method} | \`${ep.path}\` | ${ep.summary} |\n`
  }
  generated += '\n'
}

let content = readFileSync(wikiPath, 'utf8')

if (!content.includes(START)) {
  content += `\n\n## Endpoints (auto-generado)\n\n${START}${generated}${END}\n`
} else {
  const before = content.slice(0, content.indexOf(START) + START.length)
  const after = content.slice(content.indexOf(END))
  content = before + generated + after
}

writeFileSync(wikiPath, content)
console.log('✓ docs/wiki/API-Reference.md actualizado')
