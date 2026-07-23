/** TC-ACTIVITIES-CRUD — recepcionista directo (local E2E) o perfil en demo */
describe('Actividades — CRUD recepción', () => {
  beforeEach(function () {
    if (Cypress.env('TARGET') === 'prod') {
      this.skip()
    }
    cy.loginAsReception()
  })

  it('TC-ACTIVITIES-CRUD: crear, modificar y eliminar actividad', () => {
    const suffix = `${Date.now()}`
    const name = `Actividad E2E ${suffix}`
    const updatedName = `${name} Edit`

    cy.visit('/reception/actividades')
    cy.get('.activities-admin').should('be.visible')

    cy.get('.activities-admin .admin-list-create-btn').click()
    cy.get('.admin-form-modal').should('be.visible')
    cy.get('#activity-admin-name').clear().type(name)
    cy.get('#activity-admin-location').clear().type('Sala E2E')
    cy.get('#activity-admin-time').clear().type('05:00')
    cy.contains('.admin-form-modal button[type="submit"]', 'Crear actividad').should('not.be.disabled').click()
    cy.get('.admin-form-modal').should('not.exist')
    cy.get('.activities-admin').should('contain.text', name)

    cy.contains('.activity-admin-card', name).contains('button', 'Editar').click()
    cy.get('#activity-admin-name').clear().type(updatedName)
    cy.contains('button', 'Guardar cambios').click()
    cy.get('.admin-form-modal').should('not.exist')
    cy.get('.activities-admin').should('contain.text', updatedName)

    cy.contains('.activity-admin-card', updatedName).contains('button', 'Eliminar').click()
    cy.confirmDialog('Eliminar')
    cy.get('.activities-admin').should('not.contain.text', updatedName)
  })
})
