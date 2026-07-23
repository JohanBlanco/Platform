import './commands'

beforeEach(() => {
  cy.log(`Target: ${Cypress.env('TARGET')} · ${Cypress.config('baseUrl')}`)
})
