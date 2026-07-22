import { defineConfig } from 'cypress'

/** Siempre gymplatformadmin; cambiar perfil en UI con cy.switchToProfile(). */
const PLATFORM_LOGIN = 'gymplatformadmin'
const PLATFORM_PASSWORD = 'gymplatformadmin'

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
    setupNodeEvents(_on, config) {
      config.env.TARGET =
        process.env.CYPRESS_TARGET === 'prod' ||
        config.baseUrl?.includes('vercel.app') === true
          ? 'prod'
          : 'local'
      config.env.adminEmail = PLATFORM_LOGIN
      config.env.adminPassword = PLATFORM_PASSWORD
      return config
    },
  },
  env: {
    TARGET: 'local',
    adminEmail: PLATFORM_LOGIN,
    adminPassword: PLATFORM_PASSWORD,
  },
})
