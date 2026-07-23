/**
 * TC-E2E-LOCAL-05 — nutrición y medidas (demo/e2e: miembro ya puede tener datos).
 */
import { fillInputAfterLabel, selectUserInSearch } from '../../support/helpers/forms'
import { useLocalE2eHooks } from '../../support/local-e2e'

describe('Local E2E — nutrición y medidas', () => {
  useLocalE2eHooks()

  it('TC-E2E-NUTR-1: instructor crea plan nutricional', () => {
    cy.loginAsInstructor()
    cy.visit('/training/nutricion')
    selectUserInSearch('miembro')
    cy.contains('button', 'Crear plan').should('not.be.disabled').click()
    fillInputAfterLabel('Título del plan *', `Plan E2E ${Date.now()}`)
    fillInputAfterLabel('Objetivo', 'Mantenimiento')
    fillInputAfterLabel('Calorías / día', '2200')
    fillInputAfterLabel('Proteína (g)', '140')
    cy.contains('.measurement-form-tabs button', 'Comidas').click()
    cy.get('.nutrition-item-form input[placeholder="Alimento"]').first().type('Avena E2E')
    cy.contains('.admin-form-modal button[type="submit"]', 'Activar plan').should('not.be.disabled').click()
    cy.get('.admin-form-modal').should('not.exist')
    cy.get('.nutrition-active-plan').should('exist')
  })

  it('TC-E2E-MED-1: instructor registra medición corporal', () => {
    cy.loginAsInstructor()
    cy.visit('/training/medidas')
    selectUserInSearch('miembro')
    cy.contains('button', 'Nueva medición').should('not.be.disabled').click()
    cy.contains('label', 'Sexo biológico').parent().find('select').select('Hombre')
    fillInputAfterLabel('Edad (años)', '28')
    fillInputAfterLabel('Peso (kg)', '78')
    fillInputAfterLabel('Altura (cm)', '175')
    cy.contains('.admin-form-modal button[type="submit"]', 'Guardar medición').should('not.be.disabled').click()
    cy.get('.admin-form-modal').should('not.exist')
    cy.get('.measurement-history-item').should('exist')
  })

  it('TC-E2E-NUTR-2: miembro ve plan y medidas', () => {
    cy.loginAsMember()
    cy.visit('/servicios/nutricion')
    cy.get('.member-nutrition .nutrition-active-plan, .nutrition-active-plan').should('exist')
    cy.visit('/servicios/medidas')
    cy.get('.member-measurements .measurement-latest-hero, .measurement-latest-hero').should('exist')
  })
})
