import type { AuthResponse } from './types'

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

function getToken(): string | null {
  return localStorage.getItem('token')
}

let unauthorizedHandler: (() => void) | null = null
let handlingUnauthorized = false

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

function notifyUnauthorized(path: string) {
  if (handlingUnauthorized || path === '/auth/login' || path === '/auth/me') return
  handlingUnauthorized = true
  unauthorizedHandler?.()
}

export function resetUnauthorizedHandling() {
  handlingUnauthorized = false
}

const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '/api' : 'http://localhost:8080/api')

function parseErrorMessage(status: number, text: string): string {
  if (!text.trim()) {
    if (status === 401) return 'Sesión expirada. Vuelve a iniciar sesión.'
    if (status === 403) return 'No tienes permiso o la sesión expiró.'
    return `Error en la solicitud (${status})`
  }

  try {
    const body = JSON.parse(text) as Record<string, unknown>
    if (typeof body.message === 'string' && body.message !== 'Error de validación') {
      return body.message
    }
    if (body.errors && typeof body.errors === 'object') {
      const details = Object.entries(body.errors as Record<string, string>)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join('\n')
      if (details) return `Revisa los datos:\n${details}`
    }
    if (typeof body.detail === 'string') return body.detail
    if (typeof body.error === 'string') return body.error
    if (typeof body.message === 'string') return body.message
  } catch {
    // respuesta no JSON (HTML, texto plano)
  }

  return text.length > 240 ? `${text.slice(0, 240)}…` : text
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(
      `No se pudo conectar con el servidor (${API_BASE}). Verifica que el backend esté en ejecución.`,
      0,
    )
  }

  if (!response.ok) {
    const text = await response.text()
    if (response.status === 401) {
      notifyUnauthorized(path)
    }
    throw new ApiError(parseErrorMessage(response.status, text), response.status)
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  if (!text.trim()) return undefined as T
  return JSON.parse(text) as T
}

export const api = {
  login: (login: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    }),

  getSession: () => request<Omit<AuthResponse, 'token'>>('/auth/me'),

  register: (organizationId: number, data: Record<string, unknown>) =>
    request('/auth/register/' + organizationId, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPublicOrganizations: () => request<import('./types').Organization[]>('/public/organizations'),

  getMyOrganization: () =>
    request<import('./types').GymOrganization>('/organization'),

  updateMyOrganization: (data: {
    currentPassword: string
    name: string
    contactEmail?: string | null
    contactPhone?: string | null
    address?: string | null
    city?: string | null
    tagline?: string | null
    businessHours?: string | null
    websiteUrl?: string | null
    socialHandle?: string | null
    accentId?: string
  }) =>
    request<import('./types').GymOrganization>('/organization', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getMe: () => request<import('./types').User>('/users/me'),

  updateProfile: (data: Record<string, unknown>) =>
    request('/users/me/profile', { method: 'PUT', body: JSON.stringify(data) }),

  getPackages: () => request<import('./types').MembershipPackage[]>('/packages'),

  getProductCategories: () =>
    request<import('./types').ProductCategory[]>('/product-categories'),

  createProductCategory: (data: { name: string; description?: string }) =>
    request<import('./types').ProductCategory>('/product-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProducts: (categoryIds?: number[]) => {
    const params = new URLSearchParams()
    categoryIds?.forEach((id) => params.append('categoryIds', String(id)))
    const q = params.toString()
    return request<import('./types').Product[]>(`/products${q ? `?${q}` : ''}`)
  },

  getProduct: (id: number) =>
    request<import('./types').Product>(`/products/${id}`),

  createProduct: (data: Record<string, unknown>) =>
    request<import('./types').Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: number, data: Record<string, unknown>) =>
    request<import('./types').Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: number) =>
    request<void>(`/products/${id}`, { method: 'DELETE' }),

  suggestProductImages: (q: string) =>
    request<import('./types').ProductImageSuggestion[]>(
      `/products/image-suggestions?q=${encodeURIComponent(q)}`,
    ),

  getCashSettings: () =>
    request<import('./types').CashSettings>('/cash/settings'),

  updateCashSettings: (data: {
    openingFloatColones: number
    systemIvaPercent: number
    denominations: Array<{
      id?: number | null
      valueColones: number
      kind: import('./types').CashDenominationKind
      sortOrder: number
      active: boolean
    }>
  }) =>
    request<import('./types').CashSettings>('/cash/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getCashDenominations: () =>
    request<import('./types').CashDenomination[]>('/cash/denominations'),

  getActiveCashDenominations: () =>
    request<import('./types').CashDenomination[]>('/cash/denominations/active'),

  getCashOpeningFloat: () =>
    request<{ openingFloatColones: number; systemIvaPercent: number }>('/cash/opening-float'),

  replaceCashDenominations: (denominations: Array<{
    id?: number | null
    valueColones: number
    kind: import('./types').CashDenominationKind
    sortOrder: number
    active: boolean
  }>) =>
    request<import('./types').CashDenomination[]>('/cash/denominations', {
      method: 'PUT',
      body: JSON.stringify({ denominations }),
    }),

  getCurrentCashSession: () =>
    request<import('./types').CashSession | null>('/cash/session/current'),

  getCashSessionsForDay: (date?: string) => {
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    const q = params.toString()
    return request<import('./types').CashSession[]>(`/cash/sessions${q ? `?${q}` : ''}`)
  },

  openCashSession: (data: { counts: Array<{ valueColones: number; quantity: number }>; notes?: string }) =>
    request<import('./types').CashSession>('/cash/session/open', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  closeCashSession: (id: number, data: { counts: Array<{ valueColones: number; quantity: number }>; notes?: string }) =>
    request<import('./types').CashSession>(`/cash/session/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  storeCheckout: (data: {
    memberId?: number
    notes?: string
    payments: Array<{
      method: import('./types').PaymentMethod
      amount: number
      paymentProofData?: string | null
    }>
    items: Array<{
      productId?: number
      membershipPackageId?: number
      kind: import('./types').StoreSaleItemKind
      quantity: number
      applyIva?: boolean
    }>
  }) =>
    request<import('./types').StoreSale>('/store/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createStoreManualEntry: (data: {
    type: 'MANUAL_INCOME' | 'MANUAL_EXPENSE'
    amount: number
    notes: string
  }) =>
    request<import('./types').StoreSale>('/store/manual-entry', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteStoreSale: (id: number) =>
    request<import('./types').StoreSale>(`/store/sales/${id}`, { method: 'DELETE' }),

  attachStoreSalePaymentProof: (id: number, paymentProofData: string) =>
    request<import('./types').StoreSale>(`/store/sales/${id}/payment-proof`, {
      method: 'PUT',
      body: JSON.stringify({ paymentProofData }),
    }),

  getStoreSalePaymentProof: (id: number) =>
    request<{ paymentProofData: string }>(`/store/sales/${id}/payment-proof`),

  getStoreSales: (period: 'day' | 'month' | 'year' = 'day', date?: string) => {
    const params = new URLSearchParams({ period })
    if (date) params.set('date', date)
    return request<import('./types').StoreSale[]>(`/store/sales?${params}`)
  },

  getStoreSalesSummary: (period: 'day' | 'month' | 'year' = 'day', date?: string) => {
    const params = new URLSearchParams({ period })
    if (date) params.set('date', date)
    return request<import('./types').StoreSalesSummary>(`/store/sales/summary?${params}`)
  },

  getCashDayReport: (date?: string) => {
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    const q = params.toString()
    return request<import('./types').CashDayReport>(`/store/sales/day-report${q ? `?${q}` : ''}`)
  },

  createPackage: (data: Record<string, unknown>) =>
    request('/packages', { method: 'POST', body: JSON.stringify(data) }),

  updatePackage: (id: number, data: Record<string, unknown>) =>
    request(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  createActivity: (data: Record<string, unknown>) =>
    request('/activities', { method: 'POST', body: JSON.stringify(data) }),

  updateActivity: (id: number, data: Record<string, unknown>) =>
    request(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getActivities: (from?: string, to?: string) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const q = params.toString()
    return request<import('./types').Activity[]>(`/activities${q ? `?${q}` : ''}`)
  },

  getActivitySeries: (activeOnly = true) =>
    request<import('./types').Activity[]>(
      `/activities?series=true&status=${activeOnly ? 'active' : 'cancelled'}`,
    ),

  getActivityPromotionSlots: () =>
    request<import('./types').ActivityPromotion[]>('/activity-promotions/admin'),

  getActivityHomePromotions: () =>
    request<import('./types').ActivityPromotion[]>('/activity-promotions/home'),

  saveActivityPromotion: (
    slotIndex: number,
    data: { activityId: number; imageUrl?: string },
  ) =>
    request<import('./types').ActivityPromotion>(`/activity-promotions/${slotIndex}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  clearActivityPromotion: (slotIndex: number) =>
    request(`/activity-promotions/${slotIndex}`, { method: 'DELETE' }),

  uploadMarketingMedia: async (file: File) => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    let response: Response
    try {
      response = await fetch(`${API_BASE}/marketing/media`, {
        method: 'POST',
        headers,
        body: form,
      })
    } catch {
      throw new ApiError(
        `No se pudo conectar con el servidor (${API_BASE}). Verifica que el backend esté en ejecución.`,
        0,
      )
    }
    if (!response.ok) {
      const text = await response.text()
      if (response.status === 401) notifyUnauthorized('/marketing/media')
      throw new ApiError(parseErrorMessage(response.status, text), response.status)
    }
    return (await response.json()) as { url: string }
  },

  getSeasonThemes: () =>
    request<{ id: string; label: string }[]>('/marketing/season-themes'),

  updateSeasonTheme: (seasonTheme: string) =>
    request<{ seasonTheme: string }>('/marketing/season', {
      method: 'PUT',
      body: JSON.stringify({ seasonTheme }),
    }),

  updateProductOffer: (
    id: number,
    data: {
      offerPercent: number
      offerBadge?: string
      offerFrom?: string | null
      offerUntil?: string | null
    },
  ) =>
    request<import('./types').Product>(`/marketing/products/${id}/offer`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  clearProductOffer: (id: number) =>
    request(`/marketing/products/${id}/offer`, { method: 'DELETE' }),

  cancelActivity: (id: number, cancelReservations = false) =>
    request(`/activities/${id}?cancelReservations=${cancelReservations}`, { method: 'DELETE' }),

  getActivityCancelImpact: (id: number, occurrenceDate: string, scope: 'OCCURRENCE' | 'SERIES') => {
    const params = new URLSearchParams({ occurrenceDate, scope })
    return request<import('./types').ActivityReservationImpact>(
      `/activities/${id}/cancel-impact?${params.toString()}`,
    )
  },

  cancelActivityOccurrence: (
    id: number,
    data: {
      occurrenceDate: string
      scope: 'OCCURRENCE' | 'SERIES'
      cancelReservations?: boolean
    },
  ) =>
    request(`/activities/${id}/occurrence-cancel`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  restoreActivityOccurrence: (
    id: number,
    data: { occurrenceDate: string; scope: 'OCCURRENCE' | 'SERIES' },
  ) =>
    request(`/activities/${id}/occurrence-restore`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteActivityOccurrence: (
    id: number,
    data: { occurrenceDate: string; scope: 'OCCURRENCE' | 'SERIES' },
  ) =>
    request(`/activities/${id}/occurrence-delete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  restoreActivity: (id: number) =>
    request<import('./types').Activity>(`/activities/${id}/restore`, { method: 'POST' }),

  getActivityDeleteImpact: (id: number) =>
    request<import('./types').ActivityReservationImpact>(`/activities/${id}/reservation-impact`),

  previewActivityUpdateImpact: (id: number, data: Record<string, unknown>) =>
    request<import('./types').ActivityReservationImpact>(`/activities/${id}/reservation-impact/preview`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteActivity: (id: number, cancelReservations = false) =>
    request(`/activities/${id}?cancelReservations=${cancelReservations}`, { method: 'DELETE' }),

  editActivityOccurrence: (id: number, data: Record<string, unknown>) =>
    request<import('./types').Activity>(`/activities/${id}/occurrence-edit`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getSales: () => request<import('./types').Sale[]>('/sales'),

  getStatsSummary: () => request<import('./types').GymStats>('/stats/summary'),

  getStatisticsAccess: () =>
    request<import('./types').StatisticsAccess>('/statistics/access'),

  setStatisticsAccess: (password: string) =>
    request<import('./types').StatisticsAccess>('/statistics/access', {
      method: 'PUT',
      body: JSON.stringify({ password }),
    }),

  changeStatisticsAccess: (currentPassword: string, newPassword: string) =>
    request<import('./types').StatisticsAccess>('/statistics/access/change', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  verifyPrivateAreasPassword: (password: string) =>
    request<void>('/statistics/access/verify', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  unlockStatistics: (password: string) =>
    request<import('./types').StatisticsUnlock>('/statistics/unlock', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  getStatisticsDashboard: (
    period: 'day' | 'month' | 'year',
    date: string,
    unlockToken: string,
  ) => {
    const params = new URLSearchParams({ period, date })
    return request<import('./types').StatisticsDashboard>(
      `/statistics/dashboard?${params}`,
      { headers: { 'X-Stats-Unlock': unlockToken } },
    )
  },

  getMyMembershipUsage: () => request<import('./types').MembershipUsage>('/users/me/membership-usage'),

  getMyReservations: () => request<import('./types').Reservation[]>('/reservations/me'),

  getPendingPaymentReservations: () =>
    request<import('./types').Reservation[]>('/reservations/pending-payment'),

  createReservation: (
    activityId: number,
    options?: { payAtReception?: boolean; occurrenceDate?: string },
  ) =>
    request(`/activities/${activityId}/reservations`, {
      method: 'POST',
      body: JSON.stringify({
        payAtReception: options?.payAtReception ?? false,
        occurrenceDate: options?.occurrenceDate,
      }),
    }),

  markReservationPaid: (id: number) =>
    request(`/reservations/${id}/mark-paid`, { method: 'POST' }),

  confirmReservation: (id: number) =>
    request(`/reservations/${id}/confirm`, { method: 'POST' }),

  cancelReservation: (id: number) =>
    request(`/reservations/${id}/cancel`, { method: 'POST' }),

  getMyRoutines: () => request<import('./types').Routine[]>('/routines/me'),

  getRoutines: () => request<import('./types').Routine[]>('/routines'),

  getMemberRoutines: (memberId: number) =>
    request<import('./types').Routine[]>(`/routines/member/${memberId}`),

  getExercises: (muscleGroup?: string) => {
    const q = muscleGroup ? `?muscleGroup=${muscleGroup}` : ''
    return request<import('./types').CatalogExercise[]>(`/exercises${q}`)
  },

  createExercise: (data: {
    name: string
    muscleGroup: string
    difficulty?: string
    description?: string
  }) =>
    request<import('./types').CatalogExercise>('/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteExercise: (id: number) =>
    request<void>(`/exercises/${id}`, { method: 'DELETE' }),

  getForums: () =>
    request<import('./types').Forum[]>(`/forums`),

  getForumTopics: (slug: string, muscleGroup?: string) => {
    const q = muscleGroup ? `?muscleGroup=${muscleGroup}` : ''
    return request<import('./types').ForumTopicSummary[]>(`/forums/${slug}/topics${q}`)
  },

  getForumTopic: (topicId: number) =>
    request<import('./types').ForumTopicDetail>(`/forums/topics/${topicId}`),

  getForumTopicByExercise: (exerciseId: number) =>
    request<import('./types').ForumTopicDetail>(`/forums/exercises/by-exercise/${exerciseId}`),

  createRoutine: (data: Record<string, unknown>) =>
    request<import('./types').Routine>('/routines', { method: 'POST', body: JSON.stringify(data) }),

  fulfillRoutineRequest: (requestId: number, data: Record<string, unknown>) =>
    request<import('./types').Routine>(`/routine-requests/${requestId}/fulfill`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  saveRoutineRequestDraft: (requestId: number, data: Record<string, unknown>) =>
    request<import('./types').RoutineRequest>(`/routine-requests/${requestId}/draft`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRoutine: (id: number) =>
    request<import('./types').Routine>(`/routines/${id}`),

  getRoutineGenerationContext: (memberId: number, routineRequestId?: number | null) => {
    const params = new URLSearchParams({ memberId: String(memberId) })
    if (routineRequestId != null) params.set('routineRequestId', String(routineRequestId))
    return request<import('./types').RoutineGenerationContext>(
      `/routines/generate/context?${params.toString()}`,
    )
  },

  generateRoutine: (data: Record<string, unknown>) =>
    request<import('./types').GeneratedRoutinePlan>('/routines/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createRoutineRequest: (data: {
    description: string
    goals: string
    additionalNotes?: string
    preferredInstructorId?: number
  }) =>
    request<import('./types').RoutineRequest>('/routine-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRoutineRequests: (preferredToMe = false) => {
    const q = preferredToMe ? '?assignedToMe=true' : ''
    return request<import('./types').RoutineRequest[]>(`/routine-requests${q}`)
  },

  updateRoutineRequestStatus: (id: number, status: string) =>
    request(`/routine-requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getRoutineTemplates: () =>
    request<import('./types').RoutineTemplate[]>('/routine-templates'),

  createRoutineTemplate: (data: Record<string, unknown>) =>
    request<import('./types').RoutineTemplate>('/routine-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRoutineTemplate: (id: number, data: Record<string, unknown>) =>
    request<import('./types').RoutineTemplate>(`/routine-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  assignRoutineTemplate: (
    templateId: number,
    memberIds: number[],
    validityAmount: number,
    validityUnit: import('./types').RoutineValidityUnit,
  ) =>
    request<import('./types').Routine[]>('/routines/assign-template', {
      method: 'POST',
      body: JSON.stringify({ templateId, memberIds, validityAmount, validityUnit }),
    }),

  assignTemplateToRequest: (
    requestId: number,
    templateId: number,
    validityAmount: number,
    validityUnit: import('./types').RoutineValidityUnit,
  ) =>
    request<import('./types').Routine>(`/routine-requests/${requestId}/assign-template`, {
      method: 'POST',
      body: JSON.stringify({ templateId, validityAmount, validityUnit }),
    }),

  createAppointmentRequest: (data: {
    type: string
    notes?: string
    preferredStaffId?: number
    scheduledStart?: string
    scheduledEnd?: string
    openAppointmentId?: number
    memberId?: number
  }) =>
    request<import('./types').AppointmentRequest>('/appointment-requests', { method: 'POST', body: JSON.stringify(data) }),

  getStaffAvailability: (from: string, to: string) =>
    request<import('./types').StaffAvailability[]>(
      `/staff-availability/me?from=${from}&to=${to}`,
    ),

  getAppointmentRequests: (params?: { from?: string; to?: string; preferredToMe?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.from) query.set('from', params.from)
    if (params?.to) query.set('to', params.to)
    if (params?.preferredToMe) query.set('preferredToMe', 'true')
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return request<import('./types').AppointmentRequest[]>(`/appointment-requests${suffix}`)
  },

  getMyAppointmentRequests: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams()
    if (params?.from) query.set('from', params.from)
    if (params?.to) query.set('to', params.to)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return request<import('./types').AppointmentRequest[]>(`/appointment-requests/me${suffix}`)
  },

  acceptAppointmentRequest: (id: number, data?: {
    scheduledStart?: string
    scheduledEnd?: string
    assignedStaffId?: number
  }) =>
    request(`/appointment-requests/${id}/accept`, {
      method: 'PUT',
      body: JSON.stringify(data ?? {}),
    }),

  rejectAppointmentRequest: (id: number) =>
    request(`/appointment-requests/${id}/reject`, { method: 'PUT' }),

  updateAppointmentRequestStatus: (id: number, status: string) =>
    request(`/appointment-requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getMyStaffAvailability: (from: string, to: string) =>
    request<import('./types').StaffAvailability[]>(
      `/staff-availability/me?from=${from}&to=${to}`,
    ),

  createStaffAvailability: (data: {
    availabilityDate: string
    startTime: string
    endTime: string
    slotDurationMinutes?: number | null
  }) =>
    request('/staff-availability/me', { method: 'POST', body: JSON.stringify(data) }),

  createStaffAvailabilityRange: (data: {
    startDate: string
    endDate?: string | null
    startTime: string
    endTime: string
    slotDurationMinutes?: number | null
  }) =>
    request<{ daysCreated: number; daysSkipped: number; slotsPerDay: number; appointmentsCreated: number }>(
      '/staff-availability/me/range',
      { method: 'POST', body: JSON.stringify(data) },
    ),

  cancelAvailabilityAppointments: (availabilityId: number) =>
    request<number>(`/staff-availability/me/${availabilityId}/cancel-appointments`, { method: 'POST' }),

  deleteStaffAvailability: (id: number, options?: { cancelReserved?: boolean }) => {
    const query = options?.cancelReserved ? '?cancelReserved=true' : ''
    return request(`/staff-availability/me/${id}${query}`, { method: 'DELETE' })
  },

  updateStaffAvailability: (id: number, data: {
    startTime: string
    endTime: string
    slotDurationMinutes?: number | null
    cancelAffectedReserved?: boolean
  }) =>
    request<import('./types').StaffAvailability>(`/staff-availability/me/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateStaffAvailabilityRange: (id: number, data: {
    startDate: string
    endDate?: string | null
    startTime: string
    endTime: string
    slotDurationMinutes?: number | null
    cancelAffectedReserved?: boolean
  }) =>
    request<{ daysAffected: number; appointmentsCreated: number }>(
      `/staff-availability/me/${id}/range`,
      { method: 'PUT', body: JSON.stringify(data) },
    ),

  deleteStaffAvailabilityRange: (id: number, options?: { cancelReserved?: boolean }) => {
    const query = options?.cancelReserved ? '?cancelReserved=true' : ''
    return request<{ daysAffected: number; appointmentsCreated: number }>(
      `/staff-availability/me/${id}/range${query}`,
      { method: 'DELETE' },
    )
  },

  cancelAvailabilityRangeAppointments: (availabilityId: number) =>
    request<number>(`/staff-availability/me/${availabilityId}/range/cancel-appointments`, {
      method: 'POST',
    }),

  blockAvailabilitySlot: (availabilityId: number, data: { startTime: string; endTime: string }) =>
    request<void>(`/staff-availability/me/${availabilityId}/block-slot`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  unblockAvailabilitySlot: (availabilityId: number, data: { startTime: string; endTime: string }) =>
    request<void>(`/staff-availability/me/${availabilityId}/unblock-slot`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAppointmentSchedule: (id: number, data: {
    scheduledStart: string
    scheduledEnd: string
  }) =>
    request(`/appointment-requests/${id}/schedule`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getStaffAvailableSlots: (date: string) =>
    request<import('./types').AvailableSlot[]>(
      `/staff-availability/slots?date=${date}`,
    ),

  assignMembership: (userId: number, membershipPackageId: number) =>
    request(`/users/${userId}/membership`, {
      method: 'POST',
      body: JSON.stringify({ membershipPackageId }),
    }),

  getUsers: () => request<import('./types').User[]>('/users'),

  getInstructors: () =>
    request<Array<{ id: number; firstName: string; lastName: string }>>('/instructors'),

  getPendingMembershipPayment: () =>
    request<import('./types').User[]>('/users/pending-membership-payment'),

  createUser: (data: Record<string, unknown>) =>
    request<import('./types').UserCreateResponse>('/users', { method: 'POST', body: JSON.stringify(data) }),

  resendRegistrationForm: (userId: number) =>
    request<import('./types').WhatsappOutboundResponse>(`/users/${userId}/resend-registration-form`, {
      method: 'POST',
    }),

  sendUserWhatsappMessages: (
    userId: number,
    data: { sendRegistrationForm: boolean; templateIds?: number[] },
  ) =>
    request<import('./types').WhatsappMessagesOutboundResponse>(`/users/${userId}/send-whatsapp-messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendWhatsappMessagesBulk: (data: { sendRegistrationForm: boolean; templateIds?: number[] }) =>
    request<import('./types').WhatsappBulkMessagesOutboundResponse>('/users/send-whatsapp-messages-bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendWhatsappMessagesToPhone: (data: {
    whatsappPhone: string
    firstName?: string
    sendRegistrationForm: boolean
    templateIds?: number[]
  }) =>
    request<import('./types').WhatsappMessagesOutboundResponse>('/users/send-whatsapp-messages-phone', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: number, data: Record<string, unknown>) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  createBodyMeasurement: (data: import('./types').BodyMeasurementCreatePayload) =>
    request<import('./types').BodyMeasurement>('/body-measurements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  previewBodyMeasurement: (data: import('./types').BodyMeasurementCreatePayload) =>
    request<import('./types').BodyMeasurement>('/body-measurements/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMemberBodyMeasurements: (memberId: number) =>
    request<import('./types').BodyMeasurement[]>(`/body-measurements/member/${memberId}`),

  getMyBodyMeasurements: () =>
    request<import('./types').BodyMeasurement[]>('/body-measurements/me'),

  getBodyMeasurement: (id: number) =>
    request<import('./types').BodyMeasurement>(`/body-measurements/${id}`),

  createNutritionPlan: (data: import('./types').NutritionPlanCreatePayload) =>
    request<import('./types').NutritionPlan>('/nutrition-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateNutritionPlan: (id: number, data: import('./types').NutritionPlanCreatePayload) =>
    request<import('./types').NutritionPlan>(`/nutrition-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  archiveNutritionPlan: (id: number) =>
    request<import('./types').NutritionPlan>(`/nutrition-plans/${id}/archive`, { method: 'POST' }),

  getActiveNutritionPlans: () =>
    request<import('./types').NutritionPlan[]>('/nutrition-plans/active'),

  getMemberNutritionPlans: (memberId: number) =>
    request<import('./types').NutritionPlan[]>(`/nutrition-plans/member/${memberId}`),

  getMyNutritionPlans: () =>
    request<import('./types').NutritionPlan[]>('/nutrition-plans/me'),

  getNutritionPlan: (id: number) =>
    request<import('./types').NutritionPlan>(`/nutrition-plans/${id}`),

  getBroadcastChannelSettings: (channel: import('./types').BroadcastChannel) =>
    request<import('./types').BroadcastChannelSettings>(`/broadcast/settings/${channel}`),

  updateBroadcastChannelSettings: (
    channel: import('./types').BroadcastChannel,
    data: {
      senderPhone?: string | null
      enabled: boolean
      whatsappWebSessionConfirmed?: boolean
      deliveryMode?: import('./types').WhatsAppDeliveryMode
      cloudApiAppId?: string | null
      cloudApiPhoneNumberId?: string | null
      cloudApiWabaId?: string | null
      cloudApiGraphVersion?: string | null
      encryptedSecrets?: import('./types').EncryptedSecretPayload | null
      clearAccessToken?: boolean
      clearAppSecret?: boolean
      clearVerifyToken?: boolean
    },
  ) =>
    request<import('./types').BroadcastChannelSettings>(`/broadcast/settings/${channel}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getBroadcastTemplates: (
    channel: import('./types').BroadcastChannel,
    purpose?: import('./types').BroadcastTemplatePurpose,
  ) => {
    const query = purpose ? `?purpose=${purpose}` : ''
    return request<import('./types').BroadcastMessageTemplate[]>(`/broadcast/templates/${channel}${query}`)
  },

  createBroadcastTemplate: (
    channel: import('./types').BroadcastChannel,
    data: {
      name: string
      body: string
      purpose?: import('./types').BroadcastTemplatePurpose
      membershipPackageId?: number | null
      mediaLinks?: string[]
    },
  ) =>
    request<import('./types').BroadcastMessageTemplate>(`/broadcast/templates/${channel}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBroadcastTemplate: (
    channel: import('./types').BroadcastChannel,
    id: number,
    data: {
      name: string
      body: string
      purpose?: import('./types').BroadcastTemplatePurpose
      membershipPackageId?: number | null
      mediaLinks?: string[]
    },
  ) =>
    request<import('./types').BroadcastMessageTemplate>(`/broadcast/templates/${channel}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteBroadcastTemplate: (channel: import('./types').BroadcastChannel, id: number) =>
    request<void>(`/broadcast/templates/${channel}/${id}`, { method: 'DELETE' }),

  sendWhatsAppCloudText: (data: { to: string; body: string; previewUrl?: boolean }) =>
    request<import('./types').WhatsAppCloudSendResponse>('/whatsapp/cloud/send-text', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendWhatsAppCloudDocument: (data: {
    to: string
    documentUrl?: string | null
    fileBase64?: string | null
    filename?: string | null
    mimeType?: string | null
    caption?: string | null
  }) =>
    request<import('./types').WhatsAppCloudSendResponse>('/whatsapp/cloud/send-document', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getForms: (templateFolderId?: number | null) => {
    const query = templateFolderId != null ? `?templateFolderId=${templateFolderId}` : ''
    return request<import('./types').CustomForm[]>(`/forms${query}`)
  },

  getForm: (id: number) => request<import('./types').CustomForm>(`/forms/${id}`),

  createForm: (data: {
    title: string
    slug?: string
    description?: string | null
    accessType: import('./types').FormAccessType
    active: boolean
    fields: import('./types').FormField[]
    templateFolderId?: number | null
    responseFolderId?: number | null
  }) =>
    request<import('./types').CustomForm>('/forms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateForm: (id: number, data: {
    title: string
    slug?: string
    description?: string | null
    accessType: import('./types').FormAccessType
    active: boolean
    fields: import('./types').FormField[]
    templateFolderId?: number | null
    responseFolderId?: number | null
  }) =>
    request<import('./types').CustomForm>(`/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteForm: (id: number) => request<void>(`/forms/${id}`, { method: 'DELETE' }),

  getFormFolders: (kind: import('./types').FormFolderKind) =>
    request<import('./types').FormFolder[]>(`/forms/folders?kind=${kind}`),

  createFormFolder: (kind: import('./types').FormFolderKind, name: string) =>
    request<import('./types').FormFolder>(`/forms/folders?kind=${kind}`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getFormSubmissions: (folderId: number) =>
    request<import('./types').FormSubmissionDetail[]>(`/forms/response-folders/${folderId}/submissions`),

  getMemberFiles: () =>
    request<import('./types').MemberFileUser[]>('/member-files'),

  getMemberFilesForUser: (userId: number) =>
    request<import('./types').MemberFileUser>(`/member-files/users/${userId}`),

  getMemberFileDetail: (userId: number, submissionId: number) =>
    request<import('./types').MemberFileDetail>(`/member-files/users/${userId}/${submissionId}`),

  getPublicForm: (organizationSlug: string, formSlug: string) =>
    request<import('./types').PublicForm>(`/public/forms/${organizationSlug}/${formSlug}`),

  submitPublicForm: (organizationSlug: string, formSlug: string, answers: Record<string, unknown>, memberUserId?: number) =>
    request<import('./types').FormSubmissionResult>(`/public/forms/${organizationSlug}/${formSlug}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, memberUserId: memberUserId ?? null }),
    }),

  submitAuthenticatedForm: (formId: number, answers: Record<string, unknown>) =>
    request<import('./types').FormSubmissionResult>(`/forms/${formId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
}

export { ApiError }
