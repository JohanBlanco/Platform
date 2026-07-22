#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const wikiDir = join(__dirname, '..', 'docs', 'wiki')
const timestamp = new Date().toISOString().slice(0, 10)

const files = readdirSync(wikiDir).filter(f => f.endsWith('.md') && f !== 'SETUP-WIKI.md')

for (const file of files) {
  const path = join(wikiDir, file)
  let content = readFileSync(path, 'utf8')

  if (content.includes('_Última actualización:')) {
    content = content.replace(
      /\*Última actualización:.*\*/,
      `*Última actualización: ${timestamp} (auto-sync)*`
    )
  } else if (file === 'Home.md' && content.includes('---')) {
    content = content.replace(
      /---\n\n\*Última actualización.*\*/,
      `---\n\n*Última actualización: ${timestamp} (auto-sync)*`
    )
  }
  // Home.md has the timestamp at the end
  if (file === 'Home.md') {
    content = content.replace(
      /\*Última actualización: [^*]+\*/,
      `*Última actualización: ${timestamp} (auto-sync)*`
    )
  }

  writeFileSync(path, content)
}

console.log(`✓ Timestamps actualizados (${timestamp})`)
