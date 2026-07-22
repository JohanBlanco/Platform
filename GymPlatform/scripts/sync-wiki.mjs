#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const wikiSrc = join(ROOT, 'docs', 'wiki')
const token = process.env.WIKI_PUSH_TOKEN || process.env.GITHUB_TOKEN

function gitRemoteRepo() {
  const r = spawnSync('git', ['remote', 'get-url', 'origin'], {
    encoding: 'utf8',
    cwd: ROOT,
  })
  if (r.status !== 0) return null
  const url = r.stdout.trim()
  const match = url.match(/github\.com[:/](.+?)(?:\.git)?$/)
  return match ? match[1] : null
}

const repo = process.env.GITHUB_REPOSITORY || gitRemoteRepo()

if (!token) {
  console.log('ℹ WIKI_PUSH_TOKEN no configurado; wiki no publicada (archivos listos en docs/wiki/)')
  process.exit(0)
}

if (!repo) {
  console.warn('⚠ No se detectó repositorio GitHub; configura GITHUB_REPOSITORY=owner/repo')
  process.exit(0)
}

const wikiUrl = `https://x-access-token:${token}@github.com/${repo}.wiki.git`
const tmpDir = join(ROOT, '.tmp-wiki-sync')

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  return r.status === 0
}

try {
  rmSync(tmpDir, { recursive: true, force: true })
  mkdirSync(tmpDir, { recursive: true })

  const cloned = run('git', ['clone', wikiUrl, tmpDir], ROOT)
  if (!cloned) {
    console.log('ℹ Wiki repo no existe aún; créalo en GitHub → Wiki → Create first page')
    console.log(`  Luego vuelve a ejecutar: npm run docs:sync:full`)
    process.exit(0)
  }

  for (const file of readdirSync(wikiSrc)) {
    if (!file.endsWith('.md')) continue
    cpSync(join(wikiSrc, file), join(tmpDir, file), { overwrite: true })
  }

  run('git', ['add', '.'], tmpDir)
  const status = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8', cwd: tmpDir })
  if (!status.stdout.trim()) {
    console.log('ℹ Wiki ya está actualizada')
    process.exit(0)
  }

  run('git', ['config', 'user.email', 'docs-sync@gymplatform.local'], tmpDir)
  run('git', ['config', 'user.name', 'GymPlatform Docs Bot'], tmpDir)
  run('git', ['commit', '-m', 'docs: auto-sync from main repo'], tmpDir)
  run('git', ['push'], tmpDir)

  console.log(`✓ Wiki publicada: https://github.com/${repo}/wiki`)
} finally {
  rmSync(tmpDir, { recursive: true, force: true })
}
