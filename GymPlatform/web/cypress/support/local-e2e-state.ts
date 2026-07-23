/** Estado compartido entre specs locales (catálogo creado en 01, usado en 02–03). */
export const LOCAL_E2E_STATE_FILE = 'cypress/.local-e2e-state.json'

export type LocalE2eCatalogState = {
  runId: string
  productCash: string
  productSinpe: string
  productSoldOut: string
  membershipName: string
  activityCancel: string
  activityDate: string
  activityCancelTime: string
}

export function applyLocalE2eCatalogState(state: LocalE2eCatalogState): void {
  Cypress.env('E2E_RUN_ID', state.runId)
  Cypress.env('E2E_PRODUCT_CASH', state.productCash)
  Cypress.env('E2E_PRODUCT_SINPE', state.productSinpe)
  Cypress.env('E2E_PRODUCT_SOLDOUT', state.productSoldOut)
  Cypress.env('E2E_MEMBERSHIP', state.membershipName)
  Cypress.env('E2E_ACTIVITY_CANCEL', state.activityCancel)
  Cypress.env('E2E_ACTIVITY_DATE', state.activityDate)
  Cypress.env('E2E_ACTIVITY_CANCEL_TIME', state.activityCancelTime)
  Cypress.env('E2E_CATALOG_READY', true)
}
