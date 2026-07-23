import fs from 'node:fs'
import path from 'node:path'

import { defineConfig } from 'cypress'
import { E2E_CREDENTIALS, PLATFORM_ADMIN } from './cypress/support/credentials'
import { LOCAL_E2E_STATE_FILE } from './cypress/support/local-e2e-state'
import type { LocalE2eCatalogState } from './cypress/support/local-e2e-state'

function configureChromium(launchOptions: Cypress.BrowserLaunchOptions) {
  launchOptions.args.push(
    '--disable-features=PasswordLeakDetection,PasswordCheck,PasswordImport',
  )
  launchOptions.args.push('--disable-save-password-bubble')
  launchOptions.args.push('--password-store=basic')
  launchOptions.preferences.default = {
    ...(launchOptions.preferences.default ?? {}),
    credentials_enable_service: false,
    'profile.password_manager_enabled': false,
    'autofill.profile_enabled': false,
  }
  return launchOptions
}

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:5173',
    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 15_000,
    requestTimeout: 30_000,
    pageLoadTimeout: 60_000,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          return configureChromium(launchOptions)
        }
        return launchOptions
      })

      on('task', {
        readLocalE2eState(): LocalE2eCatalogState | null {
          const filePath = path.join(config.projectRoot, LOCAL_E2E_STATE_FILE)
          if (!fs.existsSync(filePath)) return null
          return JSON.parse(fs.readFileSync(filePath, 'utf8')) as LocalE2eCatalogState
        },
        writeLocalE2eState(state: LocalE2eCatalogState) {
          const filePath = path.join(config.projectRoot, LOCAL_E2E_STATE_FILE)
          fs.mkdirSync(path.dirname(filePath), { recursive: true })
          fs.writeFileSync(filePath, JSON.stringify(state, null, 2))
          return null
        },
        clearLocalE2eState() {
          const filePath = path.join(config.projectRoot, LOCAL_E2E_STATE_FILE)
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
          return null
        },
      })

      config.env.TARGET =
        process.env.CYPRESS_TARGET === 'prod' ||
        config.baseUrl?.includes('vercel.app') === true
          ? 'prod'
          : 'local'
      config.env.apiBaseUrl =
        process.env.CYPRESS_API_BASE_URL ?? 'http://localhost:8080/api'
      config.env.adminEmail = PLATFORM_ADMIN.email
      config.env.adminPassword = PLATFORM_ADMIN.password
      config.env.receptionEmail = E2E_CREDENTIALS.reception.email
      config.env.receptionPassword = E2E_CREDENTIALS.reception.password
      config.env.instructorEmail = E2E_CREDENTIALS.instructor.email
      config.env.instructorPassword = E2E_CREDENTIALS.instructor.password
      config.env.memberEmail = E2E_CREDENTIALS.member.email
      config.env.memberPassword = E2E_CREDENTIALS.member.password
      config.env.gymAdminEmail = E2E_CREDENTIALS.admin.email
      config.env.gymAdminPassword = E2E_CREDENTIALS.admin.password
      return config
    },
  },
  env: {
    TARGET: 'local',
    apiBaseUrl: 'http://localhost:8080/api',
    adminEmail: PLATFORM_ADMIN.email,
    adminPassword: PLATFORM_ADMIN.password,
    receptionEmail: E2E_CREDENTIALS.reception.email,
    receptionPassword: E2E_CREDENTIALS.reception.password,
    instructorEmail: E2E_CREDENTIALS.instructor.email,
    instructorPassword: E2E_CREDENTIALS.instructor.password,
    memberEmail: E2E_CREDENTIALS.member.email,
    memberPassword: E2E_CREDENTIALS.member.password,
    gymAdminEmail: E2E_CREDENTIALS.admin.email,
    gymAdminPassword: E2E_CREDENTIALS.admin.password,
  },
})
