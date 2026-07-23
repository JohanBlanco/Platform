/**
 * TC-E2E-LOCAL-04 — citas: reserva miembro → cancelación instructor (un solo flujo).
 */
import { ensureInstructorAvailabilitySlots } from '../../support/helpers/api-auth'
import { fillInputAfterLabel } from '../../support/helpers/forms'
import { useLocalE2eHooks } from '../../support/local-e2e'

describe('Local E2E — citas', () => {
  useLocalE2eHooks()

  it('TC-E2E-CITAS: reserva, cancelación y slot liberado', () => {
    ensureInstructorAvailabilitySlots()

    cy.intercept('POST', '**/api/appointment-requests**').as('bookAppointment')

    cy.loginAsMember()
    cy.visit('/servicios/solicitudes-citas')
    cy.get('.member-citas-gcal').should('be.visible')
    cy.get('.member-citas-slot:not(.is-past):not(.member-citas-slot--mine)', { timeout: 20_000 })
      .should('have.length.at.least', 1)

    cy.get('.member-citas-slot--mine').then(($mineBefore) => {
      const countBefore = $mineBefore.length

      cy.get('.member-citas-slot:not(.is-past):not(.member-citas-slot--mine)').first().click()
      cy.get('.member-citas-book-modal').should('be.visible')
      cy.get('.member-citas-book-modal select').select(0)
      fillInputAfterLabel('Nombre', 'Luis')
      fillInputAfterLabel('Apellidos', 'García')
      fillInputAfterLabel('Dirección de correo electrónico', 'miembro@gymplatform.local')
      cy.contains('.member-citas-book-modal button', 'Reservar').click()
      cy.wait('@bookAppointment').then(({ response }) => {
        expect(response?.statusCode).to.be.oneOf([200, 201])
        const apptId = response?.body?.id as number
        expect(apptId).to.be.a('number')

        cy.get('.member-citas-book-modal').should('not.exist')
        cy.get('.member-citas-slot--mine').should('have.length', countBefore + 1)

        cy.loginAsInstructor()
        cy.visit('/agenda/citas')
        cy.get(`[data-appointment-id="${apptId}"]`, { timeout: 20_000 }).click()
        cy.contains('button', 'Cancelar cita').click()
        cy.contains('button', 'Sí, cancelar').click()
        cy.get('.modal.card').should('not.exist')

        cy.loginAsMember()
        cy.visit('/servicios/solicitudes-citas')
        cy.get('.member-citas-slot--mine').should('have.length', countBefore)
      })
    })
  })
})
