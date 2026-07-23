import { e2eActivityDate, e2eActivityTime, e2eRunId, e2eUniqueSuffix, resetE2eSequence } from './helpers/dates'
import type { LocalE2eCatalogState } from './local-e2e-state'
import { applyLocalE2eCatalogState } from './local-e2e-state'
import * as catalog from './pages/reception-catalog.page'

/** Crea catálogo mínimo en UI (productos, membresía, actividad para ciclo reserva/cancel). */
export function runReceptionCatalogSeed(): Cypress.Chainable<LocalE2eCatalogState> {
  resetE2eSequence()
  const runId = `${e2eRunId()}-${Date.now().toString(36)}`
  Cypress.env('E2E_RUN_ID', runId)
  const uid = e2eUniqueSuffix()
  const productCash = `E2E Bebida ${uid}`
  const productSinpe = `E2E Snack ${e2eUniqueSuffix()}`
  const productSoldOut = `E2E Agotado ${e2eUniqueSuffix()}`
  const membershipName = `Membresía E2E ${runId}`
  const activityCancel = `Clase cancelable ${runId}`
  const activityDate = e2eActivityDate()
  const activityCancelTime = e2eActivityTime()

  catalog.visitProducts()
  catalog.createProductProfile(productCash, 'Venta efectivo E2E')
  catalog.configureLooseProduct(productCash, 1500, 20)

  catalog.createProductProfile(productSinpe, 'Venta SINPE E2E')
  catalog.configureLooseProduct(productSinpe, 2500, 15)

  catalog.createProductProfile(productSoldOut, 'Sin stock E2E')
  catalog.configureLooseProduct(productSoldOut, 900, 2)
  catalog.markProductSoldOut(productSoldOut)

  catalog.createMembership(membershipName, '25000', 'Plan mensual QA')

  catalog.createActivity({
    name: activityCancel,
    location: 'Sala B',
    startDate: activityDate,
    startTime: activityCancelTime,
    capacity: '5',
  })

  return cy.then(() => {
    const state: LocalE2eCatalogState = {
      runId,
      productCash,
      productSinpe,
      productSoldOut,
      membershipName,
      activityCancel,
      activityDate,
      activityCancelTime,
    }
    applyLocalE2eCatalogState(state)
    return cy.task('writeLocalE2eState', state).then(() => state)
  })
}
