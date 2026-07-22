#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const backendDir = join(__dirname, '..', 'backend')

if (!existsSync(join(backendDir, 'pom.xml'))) {
  console.error('❌ No se encontró backend/pom.xml')
  process.exit(1)
}

console.log('Ejecutando OpenApiExportTest (puede tardar ~30s)...')

const mvn = process.platform === 'win32' ? 'mvn.cmd' : 'mvn'
const result = spawnSync(
  mvn,
  ['test', '-Dtest=OpenApiExportTest', '-DexportOpenApi=true', '-q'],
  { cwd: backendDir, stdio: 'inherit', shell: process.platform === 'win32' }
)

if (result.status !== 0) {
  console.error('❌ Falló la exportación OpenAPI')
  process.exit(1)
}

const output = join(__dirname, '..', 'docs', 'openapi.json')
if (!existsSync(output)) {
  console.error('❌ No se generó docs/openapi.json')
  process.exit(1)
}

console.log('✓ docs/openapi.json generado')
