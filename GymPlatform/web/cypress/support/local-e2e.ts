/** Hooks compartidos para specs en cypress/e2e/local/ */
export function useLocalE2eHooks() {
  before(function () {
    if (Cypress.env('TARGET') === 'prod') {
      this.skip()
    }
    if (!Cypress.env('E2E_RUN_ID')) {
      Cypress.env('E2E_RUN_ID', `e2e-${Date.now()}`)
    }
  })

  beforeEach(() => {
    cy.intercept('GET', '**/api/products/image-suggestions*', {
      statusCode: 200,
      body: [],
    }).as('productImageSuggestions')
    cy.ensureLocalE2eBackend()
  })
}

/** Carga catálogo desde archivo de estado o lo crea si falta (evita specs vacíos/skipped). */
export function useLocalE2eCatalog() {
  before(() => {
    cy.ensureLocalE2eCatalog()
  })
}