/**
 * TC-E2E-LOCAL-02 — tres turnos de caja: efectivo, SINPE, mixto + agotado.
 */
import { useLocalE2eCatalog, useLocalE2eHooks } from '../../support/local-e2e'
import * as pos from '../../support/pages/pos.page'

describe('Local E2E — caja y ventas', () => {
  useLocalE2eHooks()
  useLocalE2eCatalog()

  beforeEach(() => {
    cy.loginAsReception()
  })

  it('TC-E2E-CASH-1: turno efectivo — abrir, vender, cerrar cuadrado', () => {
    const product = Cypress.env('E2E_PRODUCT_CASH') as string
    pos.visitPos()
    pos.ensureCashOpen()
    pos.addProductToCart(product)
    pos.checkoutAllCash()
    cy.get('.pos-cart-line').should('not.exist')
    pos.closeCashMatchingExpected()
  })

  it('TC-E2E-CASH-2: turno SINPE — venta sin efectivo en caja', () => {
    const product = Cypress.env('E2E_PRODUCT_SINPE') as string
    pos.visitPos()
    pos.ensureCashOpen()
    pos.addProductToCart(product)
    pos.checkoutAllSinpe()
    pos.closeCashMatchingExpected()
  })

  it('TC-E2E-CASH-3: turno mixto + producto agotado no vendible', () => {
    const product = Cypress.env('E2E_PRODUCT_CASH') as string
    const soldOut = Cypress.env('E2E_PRODUCT_SOLDOUT') as string
    pos.visitPos()
    pos.ensureCashOpen()
    pos.assertProductSoldOutInPos(soldOut)
    pos.addProductToCart(product)
    pos.openCheckout()
    cy.get('.pos-payment-modal').within(() => {
      cy.contains('button', 'Todo efectivo').click()
      cy.contains('.pos-split-paid-summary strong', 'Suma').invoke('text').then((sumText) => {
        const total = parseInt(sumText.replace(/[^\d]/g, ''), 10) || 0
        const cashPart = Math.floor(total / 2)
        const sinpePart = total - cashPart
        cy.contains('label', 'Efectivo (₡)').parent().find('input').first().clear().type(String(cashPart))
        cy.contains('label', 'SINPE (₡)').parent().find('input').first().clear().type(String(sinpePart))
        cy.contains('button', 'Confirmar cobro').should('not.be.disabled').click()
      })
    })
    cy.get('.pos-payment-modal').should('not.exist')
    pos.closeCashMatchingExpected()
  })

  it('TC-E2E-CASH-NEG: no se puede cobrar con caja cerrada', () => {
    const product = Cypress.env('E2E_PRODUCT_CASH') as string
    pos.visitPos()
    cy.get('.pos-cash-pill').then(($pill) => {
      if ($pill.hasClass('is-open')) {
        pos.closeCashMatchingExpected()
      }
    })
    cy.get('aside.pos-cart button.pos-checkout-btn').should('be.disabled')
    pos.ensureProductsTab()
    cy.contains('.pos-product-card', product).find('button.pos-product-main').click({ force: true })
    cy.get('aside.pos-cart button.pos-checkout-btn').should('be.disabled')
  })
})
