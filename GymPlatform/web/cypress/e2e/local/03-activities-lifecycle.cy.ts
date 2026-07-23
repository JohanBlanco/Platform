/**
 * TC-E2E-LOCAL-03 — actividades: reserva miembro → cancelación instructor.
 */
import { useLocalE2eCatalog, useLocalE2eHooks } from '../../support/local-e2e'
import * as activityCal from '../../support/pages/activity-calendar.page'

describe('Local E2E — ciclo de actividades', () => {
  useLocalE2eHooks()
  useLocalE2eCatalog()

  it('TC-E2E-ACT-1: miembro reserva clase', () => {
    const activityName = Cypress.env('E2E_ACTIVITY_CANCEL') as string
    cy.loginAsMember()
    cy.visit('/servicios/actividades')
    cy.get('.member-activities-agenda').should('be.visible')
    cy.contains('.member-activity-agenda-card', activityName).within(() => {
      cy.contains('button', 'Reservar').should('not.be.disabled').click()
    })
    cy.contains('.member-activity-agenda-card.is-reserved', activityName).should('exist')
    cy.visit('/servicios/mis-actividades')
    cy.get('.member-my-bookings .member-home-activity-list li').should('have.length.at.least', 1)
  })

  it('TC-E2E-ACT-2: instructor cancela la clase', () => {
    const activityName = Cypress.env('E2E_ACTIVITY_CANCEL') as string
    const activityDate = Cypress.env('E2E_ACTIVITY_DATE') as string
    cy.loginAsInstructor()
    activityCal.visitInstructorActivitiesCalendar()
    activityCal.openActivityOnDate(activityName, activityDate)
    activityCal.cancelOpenActivityOccurrence()
    cy.contains('.activity-block.activity-block--cancelled', activityName, { timeout: 15_000 }).should('exist')
  })

  it('TC-E2E-ACT-3: miembro ya no ve la clase reservable', () => {
    const activityName = Cypress.env('E2E_ACTIVITY_CANCEL') as string
    cy.loginAsMember()
    cy.visit('/servicios/actividades')
    cy.get('.member-activities-agenda').should('be.visible')
    cy.contains('.member-activity-agenda-card', activityName).should('not.exist')
  })
})
