declare global {
  namespace Cypress {
    interface Chainable {
      login(identifier: string, password: string): Chainable<void>
      /** gymplatformadmin / gymplatformadmin */
      loginAsPlatformAdmin(): Chainable<void>
      /** Login + menú usuario → perfil (Administrador, Recepcionista, Instructor, Miembro) */
      loginAsProfile(roleLabel: string): Chainable<void>
      waitForAuthenticatedShell(): Chainable<void>
      openUserMenu(): Chainable<void>
      switchToProfile(roleLabel: string): Chainable<void>
      logout(): Chainable<void>
      confirmDialog(buttonText: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (identifier: string, password: string) => {
  cy.visit('/login')
  cy.get('#login-identifier').should('be.visible').clear().type(identifier)
  cy.get('#login-password').clear().type(password, { log: false })
  cy.get('button.btn-primary[type="submit"]').click()
  cy.waitForAuthenticatedShell()
})

Cypress.Commands.add('loginAsPlatformAdmin', () => {
  cy.login(Cypress.env('adminEmail'), Cypress.env('adminPassword'))
})

Cypress.Commands.add('loginAsProfile', (roleLabel: string) => {
  cy.loginAsPlatformAdmin()
  cy.switchToProfile(roleLabel)
})

Cypress.Commands.add('waitForAuthenticatedShell', () => {
  const timeout = Cypress.env('TARGET') === 'prod' ? 90_000 : 30_000
  cy.get('#app-sidebar', { timeout }).should('be.visible')
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

export {}
