#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const token = process.env.NOTION_TOKEN
const pageId = process.env.NOTION_PAGE_ID?.replace(/-/g, '')

if (!token || !pageId) {
  console.log('ℹ NOTION_TOKEN / NOTION_PAGE_ID no configurados; Notion no sincronizado')
  console.log('  Ver docs/env.example y docs/notion/README.md')
  process.exit(0)
}

let Client
try {
  const notionPkg = await import('@notionhq/client')
  Client = notionPkg.Client
} catch {
  console.warn('⚠ @notionhq/client no instalado. Ejecuta: npm install')
  process.exit(0)
}

const notion = new Client({ auth: token })

const hubPath = join(ROOT, 'docs', 'notion', 'GymPlatform-Hub.md')
const changelogPath = join(ROOT, 'docs', 'wiki', 'Changelog.md')

if (!existsSync(hubPath)) {
  console.warn('⚠ Plantilla Notion no encontrada')
  process.exit(0)
}

const hub = readFileSync(hubPath, 'utf8')
const changelog = existsSync(changelogPath)
  ? readFileSync(changelogPath, 'utf8').split('---').slice(0, 3).join('---')
  : ''

const text = hub + '\n\n---\n\n## Changelog (auto-sync)\n\n' + changelog.slice(0, 2000)

function markdownToBlocks(md) {
  const blocks = []
  const lines = md.split('\n')
  let buffer = []

  const flush = (type = 'paragraph') => {
    const content = buffer.join('\n').trim()
    if (!content) { buffer = []; return }

    if (type === 'heading_1') {
      blocks.push({ object: 'block', type: 'heading_1', heading_1: { rich_text: [{ text: { content: content.slice(2) } }] } })
    } else if (type === 'heading_2') {
      blocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: content.slice(3) } }] } })
    } else if (type === 'heading_3') {
      blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: [{ text: { content: content.slice(4) } }] } })
    } else if (type === 'code') {
      blocks.push({ object: 'block', type: 'code', code: { rich_text: [{ text: { content } }], language: 'bash' } })
    } else {
      // Notion limit 2000 chars per block
      const chunks = content.match(/[\s\S]{1,1900}/g) ?? [content]
      for (const chunk of chunks) {
        blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: chunk } }] } })
      }
    }
    buffer = []
  }

  let inCode = false
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) { flush('code'); inCode = false }
      else { flush(); inCode = true }
      continue
    }
    if (inCode) { buffer.push(line); continue }
    if (line.startsWith('# ')) { flush(); buffer = [line]; flush('heading_1'); continue }
    if (line.startsWith('## ')) { flush(); buffer = [line]; flush('heading_2'); continue }
    if (line.startsWith('### ')) { flush(); buffer = [line]; flush('heading_3'); continue }
    if (line.trim() === '') { flush(); continue }
    buffer.push(line)
  }
  flush()
  if (inCode) flush('code')

  return blocks.slice(0, 100) // Notion API limit per request
}

try {
  // Obtener bloques hijos existentes y archivar (reemplazar contenido)
  const existing = await notion.blocks.children.list({ block_id: pageId, page_size: 100 })
  for (const block of existing.results) {
    await notion.blocks.delete({ block_id: block.id })
  }

  const blocks = markdownToBlocks(text)
  if (blocks.length > 0) {
    await notion.blocks.children.append({ block_id: pageId, children: blocks })
  }

  console.log('✓ Notion actualizado:', pageId)
} catch (err) {
  console.error('❌ Error Notion:', err.message)
  console.log('  Verifica NOTION_TOKEN, NOTION_PAGE_ID y que la integración tenga acceso a la página')
  process.exit(1)
}
