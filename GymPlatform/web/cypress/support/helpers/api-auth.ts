import { E2E_CREDENTIALS } from '../credentials'
import { tomorrowIso, todayIso } from './dates'

function apiBaseUrl(): string {
  return Cypress.env('apiBaseUrl') as string
}

type AvailableSlotDto = {
  available: boolean
  appointmentId: number | null
}

export function apiLogin(email: string, password: string): Cypress.Chainable<string> {
  return cy
    .request({
      method: 'POST',
      url: `${apiBaseUrl()}/auth/login`,
      body: { login: email, password },
    })
    .then((resp) => {
      expect(resp.status).to.eq(200)
      return resp.body.token as string
    })
}

function bookableSlotCount(token: string, dateIso: string): Cypress.Chainable<number> {
  return cy
    .request({
      method: 'GET',
      url: `${apiBaseUrl()}/staff-availability/slots?date=${dateIso}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    })
    .then((resp) => {
      if (resp.status !== 200) return 0
      const slots = resp.body as AvailableSlotDto[]
      return slots.filter((s) => s.available && s.appointmentId != null).length
    })
}

function availabilityAlreadyExistsResponse(resp: Cypress.Response<unknown>): boolean {
  return (
    resp.status === 400
    && String((resp.body as { message?: string })?.message ?? '').includes('Ya existe disponibilidad')
  )
}

/** Idempotente: crea disponibilidad solo si hoy/mañana no tienen slots reservables. */
export function ensureInstructorAvailabilitySlots(): Cypress.Chainable<void> {
  const now = new Date()
  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setHours(12, 0, 0, 0)
  monday.setDate(now.getDate() + mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const toIso = (d: Date) => d.toISOString().slice(0, 10)

  return apiLogin(E2E_CREDENTIALS.instructor.email, E2E_CREDENTIALS.instructor.password).then((token) => {
    bookableSlotCount(token, todayIso()).then((todayCount) => {
      if (todayCount > 0) return

      bookableSlotCount(token, tomorrowIso()).then((tomorrowCount) => {
        if (tomorrowCount > 0) return

        cy.request({
          method: 'POST',
          url: `${apiBaseUrl()}/staff-availability/me/range`,
          headers: { Authorization: `Bearer ${token}` },
          body: {
            startDate: toIso(monday),
            endDate: toIso(sunday),
            startTime: '09:00',
            endTime: '18:00',
            slotDurationMinutes: 30,
          },
          failOnStatusCode: false,
        }).then((resp) => {
          const ok = resp.status === 200 || resp.status === 201 || availabilityAlreadyExistsResponse(resp)
          expect(ok, JSON.stringify(resp.body)).to.eq(true)
        })
      })
    })
  })
}
