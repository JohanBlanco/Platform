declare global {
  namespace Cypress {
    interface Chainable {
      login(identifier: string, password: string): Chainable<void>
      loginAsPlatformAdmin(): Chainable<void>
      loginAsRole(role: 'admin' | 'reception' | 'instructor' | 'member'): Chainable<void>
      loginAsReception(): Chainable<void>
      loginAsInstructor(): Chainable<void>
      loginAsMember(): Chainable<void>
      loginAsAdmin(): Chainable<void>
      /** Login gymplatformadmin + cambio de perfil (prod / smoke) */
      loginAsProfile(roleLabel: string): Chainable<void>
      waitForAuthenticatedShell(): Chainable<void>
      assertRoleSidebar(role: 'admin' | 'reception' | 'instructor' | 'member'): Chainable<void>
      ensureLocalE2eBackend(): Chainable<void>
      ensureLocalE2eCatalog(): Chainable<void>
      openUserMenu(): Chainable<void>
      switchToProfile(roleLabel: string): Chainable<void>
      logout(): Chainable<void>
      confirmDialog(buttonText: string): Chainable<void>
      skipUnlessLocalE2e(): Chainable<void>
    }
  }
}

import { E2E_CREDENTIALS, PLATFORM_ADMIN } from './credentials'
import { runReceptionCatalogSeed } from './local-e2e-catalog'
import { applyLocalE2eCatalogState, type LocalE2eCatalogState } from './local-e2e-state'
import { ROLE_LANDING, ROLE_NAV } from './role-nav'

Cypress.Commands.add('login', (identifier: string, password: string) => {
  cy.visit('/')
  cy.clearLocalStorage()
  cy.visit('/login')
  cy.location('pathname').should('eq', '/login')
  cy.get('#login-identifier').should('be.visible').clear().type(identifier)
  cy.get('#login-password').clear().type(password, { log: false })
  cy.get('button.btn-primary[type="submit"]').click()
  cy.location('pathname', { timeout: 30_000 }).should('not.eq', '/login')
  cy.waitForAuthenticatedShell()
})

Cypress.Commands.add('loginAsPlatformAdmin', () => {
  cy.login(PLATFORM_ADMIN.email, PLATFORM_ADMIN.password)
})

Cypress.Commands.add('loginAsRole', (role: 'admin' | 'reception' | 'instructor' | 'member') => {
  const creds = E2E_CREDENTIALS[role]
  cy.login(creds.email, creds.password)
})

Cypress.Commands.add('loginAsReception', () => cy.loginAsRole('reception'))
Cypress.Commands.add('loginAsInstructor', () => cy.loginAsRole('instructor'))
Cypress.Commands.add('loginAsMember', () => cy.loginAsRole('member'))
Cypress.Commands.add('loginAsAdmin', () => cy.loginAsRole('admin'))

Cypress.Commands.add('loginAsProfile', (roleLabel: string) => {
  cy.loginAsPlatformAdmin()
  cy.switchToProfile(roleLabel)
})

Cypress.Commands.add('waitForAuthenticatedShell', () => {
  const timeout = Cypress.env('TARGET') === 'prod' ? 90_000 : 30_000
  cy.get('#app-sidebar', { timeout }).should('be.visible')
})

Cypress.Commands.add('assertRoleSidebar', (role: 'admin' | 'reception' | 'instructor' | 'member') => {
  const nav = ROLE_NAV[role]
  cy.visit(ROLE_LANDING[role])
  cy.get('#app-sidebar').should('be.visible')
  for (const prefix of nav.hrefPrefixes) {
    cy.get(`#app-sidebar a[href^="${prefix}"]`).should('exist')
  }
  for (const prefix of nav.forbiddenHrefPrefixes) {
    cy.get(`#app-sidebar a[href^="${prefix}"]`).should('not.exist')
  }
})

Cypress.Commands.add('ensureLocalE2eBackend', () => {
  const apiBaseUrl = Cypress.env('apiBaseUrl') as string
  cy.request({
    method: 'POST',
    url: `${apiBaseUrl}/auth/login`,
    body: {
      login: E2E_CREDENTIALS.reception.email,
      password: E2E_CREDENTIALS.reception.password,
    },
    failOnStatusCode: false,
  }).then((resp) => {
    expect(
      resp.status,
      'Backend E2E no disponible. Detén el server, ejecuta scripts/e2e-reset-db.sh y arranca con: mvn spring-boot:run -Dspring-boot.run.profiles=dev,e2e',
    ).to.eq(200)
    expect(resp.body.token, 'Respuesta de login inválida').to.be.a('string')
  })
})

Cypress.Commands.add('ensureLocalE2eCatalog', () => {
  if (Cypress.env('E2E_CATALOG_READY')) {
    return
  }

  cy.task('readLocalE2eState').then((state) => {
    if (!state) {
      cy.loginAsReception()
      runReceptionCatalogSeed()
      return
    }
    const catalogState = state as LocalE2eCatalogState
    cy.loginAsReception()
    cy.visit('/reception/productos')
    cy.get('body').then(($body) => {
      const hasProduct = $body.find('button.product-card').toArray().some((el) => {
        return (el.textContent ?? '').includes(catalogState.productCash)
      })
      if (hasProduct) {
        applyLocalE2eCatalogState(catalogState)
        return
      }
      cy.task('clearLocalE2eState')
      runReceptionCatalogSeed()
    })
  })
})

Cypress.Commands.add('openUserMenu', () => {
  cy.get('.user-menu-trigger').should('be.visible').click()
})

Cypress.Commands.add('switchToProfile', (roleLabel: string) => {
  cy.openUserMenu()
  cy.contains('button.user-menu-role-item', roleLabel).click()
  cy.waitForAuthenticatedShell()
})

Cypress.Commands.add('logout', () => {
  cy.openUserMenu()
  cy.contains('button.user-menu-item', 'Cerrar sesión').click()
  cy.url({ timeout: 15_000 }).should('include', '/login')
})

Cypress.Commands.add('confirmDialog', (buttonText: string) => {
  cy.get('.confirm-dialog').should('be.visible')
  cy.contains('.confirm-dialog button', buttonText).click()
  cy.get('.confirm-dialog').should('not.exist')
})

Cypress.Commands.add('skipUnlessLocalE2e', () => {
  if (Cypress.env('TARGET') === 'prod') {
    cy.log('Omitido en prod')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(cy as any).state('runnable').skip()
  }
})

export {}
