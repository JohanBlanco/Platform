#!/usr/bin/env node
/**
 * Orquestador de sincronización de documentación.
 *
 * Modos:
 *   --fast  Changelog + archivos locales (sin Maven ni push)
 *   --full  Export OpenAPI + API Reference + Wiki + Notion (default en commit/CI)
 *   (sin flag) = --fast
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const args = process.argv.slice(2)
const mode = args.includes('--full') ? 'full' : 'fast'

function run(script, extraArgs = []) {
  const scriptPath = join(__dirname, script)
  if (!existsSync(scriptPath)) {
    console.warn(`⚠ Script no encontrado: ${script}`)
    return false
  }
  const result = spawnSync(process.execPath, [scriptPath, ...extraArgs], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env },
  })
  return result.status === 0
}

console.log(`\n📚 GymPlatform — sync docs (${mode})\n`)

// Siempre: actualizar timestamp en archivos wiki
run('update-timestamps.mjs')

if (mode === 'full') {
  console.log('\n→ Exportando OpenAPI desde backend...')
  if (run('export-openapi.mjs')) {
    run('update-api-reference.mjs')
  } else {
    console.warn('⚠ OpenAPI no exportado; API Reference no actualizado')
  }
}

// Changelog desde último commit (si hay git)
run('update-changelog.mjs')

if (mode === 'full') {
  console.log('\n→ Sincronizando GitHub Wiki...')
  run('sync-wiki.mjs')

  console.log('\n→ Sincronizando Notion...')
  run('sync-notion.mjs')
}

console.log('\n✅ Sincronización completada\n')
