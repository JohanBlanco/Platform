/** Smoke — Vercel + Render */
describe('Smoke producción', () => {
  it('TC-SMOKE-001: Login gymplatformadmin y shell cargado', () => {
    cy.loginAsPlatformAdmin()
    cy.get('#app-sidebar').should('be.visible')
    cy.get('#app-sidebar').should('contain.text', 'Administración')
  })

  it('TC-SMOKE-002: Página de login accesible sin auth', () => {
    cy.visit('/login')
    cy.contains('h1', 'GymPlatform').should('be.visible')
    cy.get('#login-identifier').should('be.visible')
    cy.get('#login-password').should('be.visible')
  })
})
