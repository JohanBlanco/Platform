/** Navega el calendario de actividades (agenda) hasta el día de la ocurrencia. */
export function visitInstructorActivitiesCalendar() {
  cy.visit('/agenda/actividades')
  cy.get('.appointment-calendar').should('be.visible')
}

export function openActivityOnDate(activityName: string, dateIso: string) {
  cy.contains('button.calendar-tab', 'Día').click()
  cy.contains('.calendar-nav button', 'Hoy').click()

  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const target = new Date(`${dateIso}T12:00:00`)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000)
  const nav = diffDays >= 0 ? '›' : '‹'
  const steps = Math.abs(diffDays)

  for (let i = 0; i < steps; i += 1) {
    cy.contains('.calendar-nav button', nav).click()
  }

  cy.contains('.activity-block', activityName, { timeout: 20_000 }).should('be.visible').click({ force: true })
  cy.get('.activity-edit-modal').should('be.visible')
}

/** Cancelación ocurre dentro de `.activity-edit-modal`, no en `.confirm-dialog`. */
export function cancelOpenActivityOccurrence() {
  cy.get('.activity-edit-modal').should('be.visible')
  cy.contains('.activity-edit-modal button', 'Cancelar clase').click()
  cy.get('.activity-edit-modal .availability-scope-btn').then(($scopeBtns) => {
    if ($scopeBtns.length > 0) {
      cy.contains('.activity-edit-modal .availability-scope-btn', 'Solo esta clase').click()
    }
  })
  cy.contains('.activity-edit-modal button.btn-danger', 'Sí, confirmar', { timeout: 20_000 }).click()
  cy.get('.activity-edit-modal').should('not.exist')
}
