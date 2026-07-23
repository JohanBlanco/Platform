/** TC-LOGIN-* — docs/qa/manual-test-scripts.md */
describe('Autenticación', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('TC-LOGIN-001: gymplatformadmin inicia sesión como Administrador', () => {
    cy.loginAsPlatformAdmin()
    cy.url().should('not.include', '/login')
    cy.get('#app-sidebar').should('contain.text', 'Administración')
  })

  it('TC-LOGIN-002: Credenciales inválidas permanecen en login', () => {
    cy.get('#login-identifier').type('gymplatformadmin')
    cy.get('#login-password').type('wrong-password', { log: false })
    cy.get('button.btn-primary[type="submit"]').click()
    cy.url().should('include', '/login')
    cy.get('#app-sidebar').should('not.exist')
  })

  it('TC-LOGIN-003: gymplatformadmin puede iniciar sesión', () => {
    cy.loginAsPlatformAdmin()
    cy.url().should('not.include', '/login')
  })

  it('TC-LOGIN-004: Campos vacíos muestran aviso', () => {
    cy.get('button.btn-primary[type="submit"]').click()
    cy.contains('Ingresa correo o cédula y contraseña').should('be.visible')
    cy.url().should('include', '/login')
  })
})
