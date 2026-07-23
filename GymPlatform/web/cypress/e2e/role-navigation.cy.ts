/** TC-ROLE-* / TC-MEMBER-* / TC-LOGOUT-* — un login, cambio de perfil en menú usuario */
describe('Roles y navegación', () => {
  it('TC-MEMBER-001: Perfil Miembro ve rutinas o reservaciones', () => {
    cy.loginAsProfile('Miembro')
    cy.get('#app-sidebar').invoke('text').should((text) => {
      expect(text.includes('Reservaciones') || text.includes('Rutinas')).to.eq(true)
    })
  })

  it('TC-ROLE-001: Administrador cambia a perfil Miembro', () => {
    cy.loginAsPlatformAdmin()
    cy.switchToProfile('Miembro')
    cy.get('#app-sidebar').invoke('text').should((text) => {
      expect(text.includes('Rutinas') || text.includes('Reservaciones')).to.eq(true)
    })
  })

  it('TC-RECEP-001: Perfil Recepcionista no ve Estadísticas', () => {
    cy.loginAsProfile('Recepcionista')
    cy.get('#app-sidebar').should('not.contain.text', 'Estadísticas')
  })

  it('TC-LOGOUT-001: Cerrar sesión vuelve al login', () => {
    cy.loginAsPlatformAdmin()
    cy.logout()
    cy.url().should('include', '/login')
  })
})
