import { parseColones } from '../helpers/money'

const DENOMINATIONS = [10000, 5000, 1000, 500, 100, 50, 25]

export function waitForCashModal(title: 'Abrir caja' | 'Cerrar caja') {
  cy.get('.cash-session-modal').should('be.visible')
  cy.get('.cash-session-modal').contains('h2', title).should('be.visible')
}

function quantitiesForTotal(totalColones: number): Map<number, number> {
  const map = new Map<number, number>()
  let remaining = totalColones
  for (const value of DENOMINATIONS) {
    const qty = Math.floor(remaining / value)
    map.set(value, qty)
    remaining -= qty * value
  }
  return map
}

export function setCountsForTotal(totalColones: number) {
  const quantities = quantitiesForTotal(totalColones)
  cy.get('.cash-session-modal .cash-count-row').each(($row) => {
    const label = $row.find('span').first().text()
    const value = parseColones(label)
    const qty = quantities.get(value) ?? 0
    cy.wrap($row).find('input[type="number"]').clear().type(String(qty))
  })
}

export function readExpectedCloseTotal(): Cypress.Chainable<number> {
  return cy
    .contains('.cash-session-summary span', 'Esperado en caja')
    .parent()
    .find('strong')
    .invoke('text')
    .then((text) => parseColones(String(text)))
}

export function readExpectedOpeningFloat(): Cypress.Chainable<number> {
  return cy
    .get('.cash-session-modal')
    .contains('span', 'Fondo esperado')
    .parent()
    .find('strong')
    .invoke('text')
    .then((text) => parseColones(String(text)))
}

export function submitOpenCash() {
  cy.contains('.cash-session-modal button', 'Abrir caja').should('not.be.disabled').click()
  cy.get('.cash-session-modal').should('not.exist')
}

export function submitCloseCash() {
  cy.contains('.cash-session-modal button', 'Cerrar caja').should('not.be.disabled').click()
  cy.get('.cash-session-modal').should('not.exist')
}

export function openWithDefaultFloat() {
  waitForCashModal('Abrir caja')
  readExpectedOpeningFloat().then((expected) => {
    setCountsForTotal(expected)
    cy.get('.cash-session-modal .cash-balance--ok', { timeout: 20_000 }).should('exist')
    submitOpenCash()
  })
}

export function closeMatchingExpected() {
  waitForCashModal('Cerrar caja')
  readExpectedCloseTotal().then((expected) => {
    setCountsForTotal(expected)
    cy.get('.cash-session-modal .cash-balance--ok', { timeout: 20_000 }).should('exist')
    submitCloseCash()
  })
}
