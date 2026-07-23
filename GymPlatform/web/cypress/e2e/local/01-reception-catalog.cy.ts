/**
 * TC-E2E-LOCAL-01 — recepcionista arma catálogo desde BD vacía.
 */
import { runReceptionCatalogSeed } from '../../support/local-e2e-catalog'
import { useLocalE2eHooks } from '../../support/local-e2e'
import * as catalog from '../../support/pages/reception-catalog.page'

describe('Local E2E — catálogo recepción', () => {
  useLocalE2eHooks()

  beforeEach(() => {
    cy.loginAsReception()
  })

  it('TC-E2E-CATALOG: productos, membresía y actividades', () => {
    runReceptionCatalogSeed()
  })

  it('TC-E2E-CATALOG-NEG: producto agotado visible en admin', () => {
    cy.ensureLocalE2eCatalog()
    const soldOut = Cypress.env('E2E_PRODUCT_SOLDOUT') as string
    catalog.visitProducts()
    cy.contains('.product-card', soldOut).should('have.class', 'product-card--sold-out')
  })
})
