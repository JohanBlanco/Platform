import * as cash from './cash-session.page'

export function visitPos() {
  cy.visit('/ventas/punto-de-venta')
  cy.get('.pos-catalog, .pos-toolbar').should('be.visible')
}

export function isCashOpen() {
  cy.get('.pos-cash-pill.is-open').should('exist')
}

export function dismissBlockingOverlays() {
  cy.get('body').then(($body) => {
    const summaryClose = $body.find(".pos-sale-summary button[aria-label='Cerrar resumen']")
    if (summaryClose.length && summaryClose.is(':visible')) {
      cy.wrap(summaryClose.first()).click({ force: true })
    }
  })
  cy.get('body').then(($body) => {
    if ($body.find('.confirm-dialog').length) {
      cy.contains('.confirm-dialog button', 'Cancelar').click()
    }
  })
}

export function clickOpenCashRegister() {
  cy.contains('button', 'Abrir caja').should('not.be.disabled').click()
  cash.waitForCashModal('Abrir caja')
}

export function clickCloseCashRegister() {
  dismissBlockingOverlays()
  cy.contains('button', 'Cerrar caja').should('not.be.disabled').click()
  cash.waitForCashModal('Cerrar caja')
}

export function ensureCashOpen() {
  cy.get('.pos-cash-pill').then(($pill) => {
    if (!$pill.hasClass('is-open')) {
      clickOpenCashRegister()
      cash.openWithDefaultFloat()
    }
  })
  cy.reload()
  cy.get('.pos-catalog, .pos-toolbar').should('be.visible')
  cy.get('.pos-cash-pill.is-open').should('exist')
  cy.get('button.pos-product-main:not([disabled])').should('have.length.at.least', 1)
}

export function ensureProductsTab() {
  cy.get('.pos-catalog-head').contains('button.product-manage-tab', 'Productos').then(($tab) => {
    if (!$tab.hasClass('active')) {
      cy.wrap($tab).click()
    }
  })
}

export function addProductToCart(productName: string) {
  ensureProductsTab()
  cy.contains('.pos-product-card', productName).within(() => {
    cy.get('button.pos-product-main:not([disabled])').click()
  })
  cy.get('body').then(($body) => {
    if ($body.find('.confirm-dialog').length) {
      cy.confirmDialog('Sí, vender contenedor')
    }
  })
  cy.get('.pos-cart-line').should('be.visible')
}

export function assertProductSoldOutInPos(productName: string) {
  cy.contains('.pos-product-card', productName).should('have.class', 'is-sold-out')
  cy.contains('.pos-product-card', productName).find('button.pos-product-main').should('be.disabled')
}

export function openCheckout() {
  cy.get('aside.pos-cart button.pos-checkout-btn:not([disabled])').click()
  cy.get('.pos-payment-modal').should('be.visible')
}

export function checkoutAllCash() {
  openCheckout()
  cy.contains('.pos-payment-modal button', 'Todo efectivo').click()
  cy.contains('.pos-payment-modal button', 'Confirmar cobro').should('not.be.disabled').click()
  cy.get('.pos-payment-modal').should('not.exist')
}

export function checkoutAllSinpe() {
  openCheckout()
  cy.contains('.pos-payment-modal button', 'Todo SINPE').click()
  cy.contains('.pos-payment-modal button', 'Confirmar cobro').should('not.be.disabled').click()
  cy.get('.pos-payment-modal').should('not.exist')
}

export function checkoutMixedCashSinpe(cashAmount: number, sinpeAmount: number) {
  openCheckout()
  cy.contains('.pos-payment-modal label', 'Efectivo (₡)').parent().find('input').clear().type(String(cashAmount))
  cy.contains('.pos-payment-modal label', 'SINPE (₡)').parent().find('input').clear().type(String(sinpeAmount))
  cy.contains('.pos-payment-modal button', 'Confirmar cobro').should('not.be.disabled').click()
  cy.get('.pos-payment-modal').should('not.exist')
}

export function closeCashMatchingExpected() {
  clickCloseCashRegister()
  cash.closeMatchingExpected()
  cy.get('.pos-cash-pill:not(.is-open)').should('exist')
}
