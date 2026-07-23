/**
 * TC-E2E-LOCAL-00 — smoke: cuentas por rol en BD vacía (perfil dev,e2e).
 */
import { useLocalE2eHooks } from '../../support/local-e2e'

describe('Local E2E — autenticación por rol', () => {
  useLocalE2eHooks()

  before(function () {
    Cypress.env('E2E_RUN_ID', `e2e-${Date.now()}`)
  })

  const roles = [
    { key: 'reception' as const, label: 'Recepcionista' },
    { key: 'instructor' as const, label: 'Instructor' },
    { key: 'member' as const, label: 'Miembro' },
    { key: 'admin' as const, label: 'Administrador' },
  ]

  roles.forEach(({ key, label }) => {
    it(`TC-E2E-AUTH-${key}: login ${label} sin cambiar perfil`, () => {
      cy.loginAsRole(key)
      cy.assertRoleSidebar(key)
      cy.logout()
    })
  })

  it('TC-E2E-AUTH-NEG: recepcionista no accede a estadísticas', () => {
    cy.loginAsReception()
    cy.visit('/estadisticas/resumen')
    cy.location('pathname', { timeout: 10_000 }).should('not.eq', '/estadisticas/resumen')
    cy.get('#app-sidebar a[href^="/estadisticas/"]').should('not.exist')
  })
})
