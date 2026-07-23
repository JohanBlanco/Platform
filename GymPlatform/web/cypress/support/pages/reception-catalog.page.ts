import {
  dismissProductImagePicker,
  fillInputAfterLabel,
  fillTextareaAfterLabel,
  selectTagOptionInModal,
  setHorizontalSwitch,
} from '../helpers/forms'

export function visitProducts() {
  cy.visit('/reception/productos')
  cy.get('.products-section').should('be.visible')
}

export function createProductProfile(name: string, description = 'Producto E2E') {
  cy.contains('.products-toolbar button', 'Nuevo producto').click()
  cy.get('.admin-form-modal').should('be.visible')
  fillInputAfterLabel('Nombre', name)
  dismissProductImagePicker()
  selectTagOptionInModal('Otros')
  fillTextareaAfterLabel('Descripción (opcional)', description)
  cy.contains('.admin-form-modal button[type="submit"]', 'Registrar producto').should('not.be.disabled').click()
  cy.get('.admin-form-modal').should('not.exist')
  cy.contains('button.product-card', name).should('exist')
}

/** openManage() abre directo en «Inventario y venta» — no cambiar a Perfil. */
export function openProduct(name: string) {
  cy.contains('button.product-card', name).click()
  cy.get('.admin-form-modal').should('be.visible')
}

export function openInventoryTab() {
  cy.contains('.admin-form-modal button.product-manage-tab', 'Inventario y venta').then(($tab) => {
    if (!$tab.hasClass('active')) {
      cy.wrap($tab).click()
    }
  })
  cy.contains('.admin-form-modal button.product-manage-tab', 'Inventario y venta').should('have.class', 'active')
  cy.get('.admin-form-modal .product-inventory-flow').should('exist')
}

export function selectLoosePresentation() {
  cy.contains('.admin-form-modal .product-choice-card', 'Unidad').click()
  cy.contains('.admin-form-modal .product-choice-card', 'Unidad').should('have.class', 'active')
}

export function configureLooseProduct(name: string, unitPrice: number, stockUnits: number) {
  openProduct(name)
  openInventoryTab()
  selectLoosePresentation()
  cy.contains('.admin-form-modal label', 'Precio de la unidad').find('input').clear().type(String(unitPrice))
  fillInputAfterLabel('+ unidades', String(stockUnits))
  cy.contains('.admin-form-modal button[type="submit"]', 'Guardar inventario').click()
  cy.get('.admin-form-modal').should('not.exist')
}

export function markProductSoldOut(name: string) {
  openProduct(name)
  openInventoryTab()
  selectLoosePresentation()
  fillInputAfterLabel('Precio de la unidad', '100')
  fillInputAfterLabel('+ unidades', '1')
  cy.get('#product-mark-sold-out').click({ force: true })
  cy.contains('.admin-form-modal button[type="submit"]', 'Guardar inventario').click()
  cy.get('.admin-form-modal').should('not.exist')
}

export function createMembership(name: string, monthlyPrice: string, description: string) {
  cy.visit('/reception/membresias')
  cy.get('.admin-section').should('be.visible')
  cy.contains('button.admin-list-create-btn', 'Crear Membresía').click()
  fillInputAfterLabel('Nombre', name)
  fillInputAfterLabel('Precio mensual', monthlyPrice)
  fillTextareaAfterLabel('Descripción', description)
  cy.contains('button', 'Crear membresía').click()
  cy.get('.admin-form-modal').should('not.exist')
  cy.contains('.card-selectable', name).should('exist')
}

export function createActivity(opts: {
  name: string
  location: string
  startDate: string
  startTime: string
  capacity?: string
}) {
  cy.visit('/reception/actividades')
  cy.get('.activities-admin').should('be.visible')
  cy.get('.activities-admin .admin-list-create-btn').click()
  cy.get('.admin-form-modal').should('be.visible')
  cy.get('#activity-admin-name').clear().type(opts.name)
  cy.get('#activity-admin-location').clear().type(opts.location)
  cy.get('#activity-admin-start').clear().type(opts.startDate)
  cy.get('#activity-admin-time').clear().type(opts.startTime)
  if (opts.capacity) {
    setHorizontalSwitch('Cupo ilimitado', false)
    cy.get('#activity-admin-capacity').should('be.visible').clear().type(opts.capacity)
  }
  cy.contains('.admin-form-modal button[type="submit"]', 'Crear actividad').should('not.be.disabled').click()
  cy.get('.admin-form-modal').should('not.exist')
  cy.contains('.activity-admin-card', opts.name).should('exist')
}
