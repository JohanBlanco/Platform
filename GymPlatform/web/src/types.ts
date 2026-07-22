export interface AuthResponse {
  token: string
  userId: number
  email: string
  firstName: string
  lastName: string
  roles: string[]
  organizationId: number | null
}

export type MemberMembershipStatus = 'ACTIVE' | 'PAYMENT_PENDING' | 'INACTIVE'

export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  roles: string[]
  organizationId: number | null
  active: boolean
  profile?: MemberProfile
  membershipStatus?: MemberMembershipStatus | null
  nextPaymentDate?: string | null
  membershipPackageName?: string | null
  hasQueuedRenewal?: boolean
  queuedStartDate?: string | null
  queuedPackageName?: string | null
  whatsappPhone?: string | null
  nationalId?: string | null
}

export interface MemberProfile {
  birthYear?: number
  age?: number
  goals?: string
  phone?: string
  emergencyContact?: string
  nationalId?: string | null
}

export interface GymOrganization {
  id: number
  name: string
  slug: string
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  city: string | null
  tagline: string | null
  businessHours: string | null
  websiteUrl: string | null
  socialHandle: string | null
  accentId: string
  seasonTheme?: string
}

export interface Organization {
  id: number
  name: string
  slug: string
  contactEmail: string
  contactPhone: string
  subscriptionStatus: string
  active: boolean
  ownerFirstName?: string
  ownerLastName?: string
  ownerEmail?: string
}

export type GymStaffRole = 'GYM_OWNER' | 'RECEPTIONIST' | 'INSTRUCTOR' | 'MEMBER'

export interface PackageAddon {
  id: number
  name: string
  description: string
  price: number
  active: boolean
}

export interface PriceAddon {
  name: string
  percent: number
}

export interface MembershipPackage {
  id: number
  name: string
  description: string
  price: number
  durationMonths: number
  freeActivityQuota: number | null
  active: boolean
  addons: PackageAddon[]
  applyIva?: boolean
  ivaPercent?: number | null
  priceAddons?: PriceAddon[]
  priceWithAddons?: number
}

export interface ProductCategory {
  id: number
  name: string
  slug: string
  description: string | null
  sortOrder: number
}

export interface Product {
  id: number
  name: string
  codePrefix: string
  description: string | null
  imageUrl: string | null
  categories: ProductCategory[]
  stockUnits: number
  unitsPerPackage: number
  fullPackagesAvailable: number
  packageLabel: string
  unitLabel: string
  packagePrice: number
  unitPrice: number
  sellByPackage: boolean
  sellByUnit: boolean
  outOfStock: boolean
  applyIva?: boolean
  ivaPercent?: number | null
  priceAddons?: PriceAddon[]
  packagePriceWithAddons?: number
  unitPriceWithAddons?: number
  offerActive?: boolean
  offerPercent?: number | null
  offerBadge?: string | null
  offerFrom?: string | null
  offerUntil?: string | null
}

export interface ProductImageSuggestion {
  url: string
  title: string | null
  source: string | null
}

export type CashDenominationKind = 'COIN' | 'BILL'
export type CashSessionStatus = 'OPEN' | 'CLOSED'
export type StoreSaleType = 'SALE' | 'MANUAL_INCOME' | 'MANUAL_EXPENSE'
export type StoreSaleItemKind = 'UNIT' | 'PACKAGE' | 'MEMBERSHIP' | 'MANUAL'
export type PaymentMethod = 'CASH' | 'CARD' | 'SINPE'

export interface StoreSalePayment {
  id: number | null
  method: PaymentMethod
  amount: number
  hasPaymentProof: boolean
}

export interface CashDenomination {
  id: number
  valueColones: number
  kind: CashDenominationKind
  sortOrder: number
  active: boolean
}

export interface CashSettings {
  openingFloatColones: number
  /** Porcentaje de I.V.A. de referencia del gimnasio. */
  systemIvaPercent: number
  denominations: CashDenomination[]
}

export interface CashCountLine {
  valueColones: number
  quantity: number
  subtotal: number
}

export interface CashSession {
  id: number | null
  status: CashSessionStatus | null
  openedAt: string | null
  closedAt: string | null
  openedByName: string
  closedByName: string | null
  openingTotal: number
  closingTotal: number | null
  expectedClosingTotal: number | null
  salesNetTotal: number
  notes: string | null
  openingCounts: CashCountLine[]
  closingCounts: CashCountLine[]
}

export interface StoreSaleItem {
  id: number
  kind: StoreSaleItemKind
  productId: number | null
  membershipPackageId: number | null
  description: string
  quantity: number
  stockUnitsDeducted: number
  unitPrice: number
  lineTotal: number
}

export interface StoreSale {
  id: number
  type: StoreSaleType
  createdAt: string
  total: number
  notes: string | null
  memberId: number | null
  memberName: string | null
  createdByName: string
  cashSessionId: number | null
  paymentMethod?: PaymentMethod | null
  hasPaymentProof?: boolean
  cashAmount?: number
  payments?: StoreSalePayment[]
  items: StoreSaleItem[]
  voided?: boolean
  /** true si la caja del movimiento sigue abierta */
  deletable?: boolean
}

export interface StoreSalesSummary {
  salesTotal: number
  incomeTotal: number
  expenseTotal: number
  netTotal: number
  saleCount: number
}

export interface CashSessionDayBlock {
  session: CashSession
  summary: StoreSalesSummary
  sales: StoreSale[]
}

export interface CashDayReport {
  date: string
  daySummary: StoreSalesSummary
  sessions: CashSessionDayBlock[]
}

export interface Activity {
  id: number
  name: string
  description: string
  imageUrl?: string | null
  activityDate: string
  startDate: string
  endDate: string
  recurring: boolean
  repeatDays: string[]
  startTime: string
  endTime: string
  locationName: string
  instructorId: number | null
  instructorName: string | null
  capacity: number | null
  confirmedReservations: number
  hasCapacity: boolean
  hasOccurrenceOverride: boolean
  allDay: boolean
  active: boolean
  occurrenceCancelled: boolean
}

export interface ActivityPromotion {
  slotIndex: number
  populated: boolean
  manual: boolean
  activityId: number | null
  name: string | null
  description: string | null
  imageUrl: string | null
  nextOccurrenceDate: string | null
  startTime: string | null
  endTime: string | null
  locationName: string | null
  instructorName: string | null
  reservationCount: number
}

export interface MembershipUsage {
  membershipPackageId: number | null
  membershipName: string | null
  freeActivityQuota: number | null
  freeActivitiesUsed: number
  freeActivitiesRemaining: number | null
  unlimitedFreeActivities: boolean
}

export interface Reservation {
  id: number
  activityId: number | null
  activityName: string
  occurrenceDate: string
  memberId: number
  memberName: string
  status: 'CONFIRMED' | 'CANCELLED'
  freeSlot: boolean
  paymentRequired: boolean
  paid: boolean
  attended: boolean
  createdAt: string
}

export interface ActivityReservationImpact {
  activeReservations: number
  affectedReservations: number
  items: {
    reservationId: number
    occurrenceDate: string
    memberName: string
    status: 'CONFIRMED' | 'CANCELLED'
  }[]
}

export type BroadcastChannel = 'WHATSAPP'

export type BroadcastTemplatePurpose = 'GENERAL' | 'WELCOME'

export type FormAccessType = 'PUBLIC' | 'AUTHENTICATED'

export type FormFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'EMAIL'
  | 'PHONE'
  | 'NUMBER'
  | 'SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'DATE'
  | 'HEADING'
  | 'SIGNATURE'

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string | null
  helpText?: string | null
  required: boolean
  options: string[]
  visibilityFieldId?: string | null
  visibilityValue?: string | null
}

export type FormPurpose = 'MEMBER_REGISTRATION' | 'MEMBER_SIGNUP' | 'MEMBER_ONBOARDING' | 'CUSTOM'

export const FORM_PURPOSE_LABELS: Record<FormPurpose, string> = {
  MEMBER_REGISTRATION: 'Registro (expediente)',
  MEMBER_SIGNUP: 'Alta de usuario',
  MEMBER_ONBOARDING: 'Alta + registro',
  CUSTOM: 'Personalizado',
}

export interface CustomForm {
  id: number
  title: string
  slug: string
  description: string | null
  accessType: FormAccessType
  formPurpose: FormPurpose
  systemDefault: boolean
  active: boolean
  fields: FormField[]
  publicUrl: string
  templateFolderId: number | null
  templateFolderName: string | null
  responseFolderId: number | null
  responseFolderName: string | null
  submissionCount: number
  createdAt: string
  updatedAt: string
}

export type FormFolderKind = 'TEMPLATE' | 'RESPONSE'

export interface FormFolder {
  id: number
  name: string
  slug: string
  kind: FormFolderKind
  autoGenerated: boolean
  sourceFormId: number | null
  submissionCount: number
  formCount: number
  createdAt: string
}

export interface FormSubmissionDetail {
  id: number
  formId: number
  formTitle: string
  responseFolderId: number | null
  responseFolderName: string | null
  submitterName: string | null
  answers: Record<string, unknown>
  createdAt: string
  importedAt: string | null
}

export interface MemberFileSummary {
  id: number
  formId: number
  formTitle: string
  formSlug: string
  createdAt: string
}

export interface MemberFileUser {
  userId: number
  firstName: string
  lastName: string
  email: string
  fileCount: number
  files: MemberFileSummary[]
}

export interface MemberFileDetail {
  id: number
  userId: number
  userFullName: string
  userEmail: string
  formId: number
  formTitle: string
  formDescription: string | null
  organizationName: string
  fields: FormField[]
  answers: Record<string, unknown>
  createdAt: string
}

export type FormImportTargetModel = 'USER'
export type FormImportMode = 'CREATE' | 'UPDATE'
export type FormImportMatchField = 'EMAIL' | 'NATIONAL_ID' | 'WHATSAPP'

export interface FormImportModelField {
  key: string
  label: string
  requiredForCreate: boolean
}

export interface FormImportModel {
  model: FormImportTargetModel
  label: string
  description: string
  fields: FormImportModelField[]
  matchFields: FormImportMatchField[]
}

export interface FormImportFieldMapping {
  formFieldId: string
  targetField: string
}

export interface FormImportPreviewRow {
  submissionId: number
  formTitle: string
  action: FormImportMode
  status: string
  message: string
  matchedUserId: number | null
  previewValues: Record<string, string>
}

export interface FormImportPreview {
  totalSubmissions: number
  readyCount: number
  skippedCount: number
  errorCount: number
  rows: FormImportPreviewRow[]
}

export interface FormImportResult {
  created: number
  updated: number
  skipped: number
  errors: number
}

export interface PublicForm {
  id: number
  title: string
  slug: string
  description: string | null
  accessType: FormAccessType
  formPurpose?: FormPurpose
  createsUser?: boolean
  requiresAuth: boolean
  organizationName: string
  organizationSlug: string
  fields: FormField[]
  membershipPackages?: Array<{ id: number; name: string }>
}

export interface FormSubmissionResult {
  id: number
  createdAt: string
  userCreated?: boolean
  createdUserId?: number | null
  message?: string | null
}

export interface UserCreateResponse {
  user: User
  registrationFormWhatsappUrl: string | null
  registrationFormDeliveryMode?: WhatsAppDeliveryMode | string | null
  registrationFormCloudMessageId?: string | null
  whatsappMessagePreviews?: string[]
}

export type WhatsAppDeliveryMode = 'WA_ME' | 'CLOUD_API'

export interface WhatsappOutboundResponse {
  whatsappUrl: string | null
  messagePreview: string
  deliveryMode?: WhatsAppDeliveryMode | string
  cloudMessageId?: string | null
}

export interface WhatsappMessagesOutboundResponse {
  whatsappUrl: string | null
  messagePreviews: string[]
  deliveryMode?: WhatsAppDeliveryMode | string
  cloudMessageId?: string | null
}

export interface WhatsappBulkMessagesOutboundResponse {
  recipientCount: number
  sentCount: number
  failedCount: number
  deliveryMode?: WhatsAppDeliveryMode | string
  errors: string[]
}

export interface EncryptedSecretPayload {
  alg: string
  keyId: string
  encryptedKey: string
  iv: string
  ciphertext: string
}

export interface WhatsAppCloudSendResponse {
  messageId: string | null
  mediaId: string | null
}

export interface BroadcastChannelSettings {
  channel: BroadcastChannel
  senderPhone: string | null
  enabled: boolean
  whatsappWebSessionConfirmed: boolean
  deliveryMode: WhatsAppDeliveryMode
  cloudApiAppId: string | null
  cloudApiPhoneNumberId: string | null
  cloudApiWabaId: string | null
  cloudApiGraphVersion: string | null
  cloudApiAccessTokenConfigured: boolean
  cloudApiAppSecretConfigured: boolean
  cloudApiVerifyTokenConfigured: boolean
  cloudApiReady: boolean
  cryptoPublicKeyPem: string
  cryptoKeyId: string
  cryptoAlg: string
  updatedAt: string
}

export interface BroadcastMessageTemplate {
  id: number
  channel: BroadcastChannel
  name: string
  body: string
  purpose: BroadcastTemplatePurpose
  membershipPackageId?: number | null
  membershipPackageName?: string | null
  mediaLinks?: string[]
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: number
  memberName: string
  activityName: string
  concept: string
  amount: number
  paidAt: string
}

export interface GymStats {
  memberCount: number
  activitiesScheduled: number
  activitiesToday: number
  reservationsToday: number
  confirmedReservations: number
  pendingPayments: number
  salesToday: number
  salesThisMonth: number
  attendancesThisMonth: number
}

export interface StatisticsAccess {
  configured: boolean
}

export interface StatisticsUnlock {
  unlockToken: string
  expiresAt: string
}

export interface StatisticsKpis {
  incomeTotal: number
  expenseTotal: number
  salesTotal: number
  netTotal: number
  averageTicket: number
  saleCount: number
  incomeChangePct: number
  expenseChangePct: number
  netChangePct: number
}

export interface StatisticsTimePoint {
  key: string
  label: string
  income: number
  expense: number
  sales: number
}

export interface StatisticsNamedAmount {
  name: string
  amount: number
  count: number
}

export interface StatisticsDashboard {
  period: string
  date: string
  periodLabel: string
  kpis: StatisticsKpis
  previousKpis: StatisticsKpis
  timeSeries: StatisticsTimePoint[]
  byCategory: StatisticsNamedAmount[]
  topProducts: StatisticsNamedAmount[]
  incomeVsExpense: StatisticsNamedAmount[]
  byPaymentMethod: StatisticsNamedAmount[]
}

export interface RoutineExercise {
  id?: number
  exerciseId?: number | null
  exerciseName: string
  imageUrl?: string | null
  sets: number
  reps: number
  weight?: string | number
  durationSeconds?: number
  notes?: string
  orderIndex: number
}

export interface RoutineDay {
  id?: number
  dayNumber: number
  dayLabel: string
  orderIndex?: number
  exercises: RoutineExercise[]
}

export type RoutineValidityUnit = 'DAYS' | 'WEEKS' | 'MONTHS'

export interface Routine {
  id: number
  name: string
  description: string
  notes?: string
  memberId: number
  memberName: string
  instructorId: number
  instructorName: string
  templateId: number | null
  temporary: boolean
  daysPerWeek?: number | null
  validFrom?: string | null
  validUntil?: string | null
  validityAmount?: number | null
  validityUnit?: RoutineValidityUnit | null
  expired?: boolean
  days: RoutineDay[]
  exercises: RoutineExercise[]
}

export interface RoutineGenerationContext {
  memberId: number
  memberName: string
  age: number | null
  sex: string | null
  level: string | null
  goals: string | null
  injuries: string | null
  levelKnown: boolean
  injuriesKnown: boolean
  goalsKnown: boolean
  sexKnown: boolean
  knownSources: string[]
}

export interface GeneratedRoutinePlan {
  name: string
  description: string
  notes: string
  daysPerWeek: number
  focus: string
  instructorSummary: string
  days: RoutineDay[]
}

export interface RoutineTemplate {
  id: number
  name: string
  description: string
  goal?: string
  instructorId: number
  daysPerWeek?: number | null
  days: RoutineDay[]
  exercises: RoutineExercise[]
}

export type MuscleGroup =
  | 'CHEST' | 'SHOULDER' | 'BICEP' | 'TRICEP' | 'FOREARM' | 'TRAPEZIUS'
  | 'ABS' | 'CARDIO' | 'LEG' | 'HAMSTRING' | 'QUADRICEPS' | 'CALF'

export type ExerciseDifficulty = 'BASIC' | 'ADVANCED'

export interface CatalogExercise {
  id: number
  name: string
  muscleGroup: MuscleGroup
  difficulty: ExerciseDifficulty
  imageUrl: string
  videoUrl?: string | null
  guideUrl?: string | null
  description: string
}

export interface Forum {
  id: number
  slug: string
  title: string
  description: string
  topicCount: number
}

export interface ForumTopicSummary {
  id: number
  exerciseId: number | null
  title: string
  imageUrl: string | null
  videoUrl: string | null
  sourceUrl: string | null
  muscleGroup: MuscleGroup | null
}

export interface ForumTopicDetail extends ForumTopicSummary {
  forumId: number
  forumSlug: string
  bodyMarkdown: string
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  CHEST: 'Pectorales',
  SHOULDER: 'Hombros',
  BICEP: 'Bíceps',
  TRICEP: 'Tríceps',
  FOREARM: 'Antebrazo',
  TRAPEZIUS: 'Espalda',
  ABS: 'Abdominales',
  CARDIO: 'Cardio',
  LEG: 'Piernas',
  HAMSTRING: 'Femorales',
  QUADRICEPS: 'Cuádriceps',
  CALF: 'Gemelos',
}

/** Categorías del catálogo (Simply Fitness). Espalda = TRAPEZIUS. */
export const CATALOG_MUSCLE_GROUPS: MuscleGroup[] = [
  'CHEST', 'TRAPEZIUS', 'SHOULDER', 'BICEP', 'TRICEP', 'ABS', 'LEG', 'CALF',
]

export interface RoutineRequest {
  id: number
  memberId: number
  memberName: string
  description: string
  goals: string
  additionalNotes?: string | null
  status: string
  preferredInstructorId: number | null
  preferredInstructorName: string | null
  assignedInstructorId: number | null
  assignedInstructorName: string | null
  resultingRoutineId: number | null
  resultingRoutineName?: string | null
  completedAt?: string | null
}

export type AppointmentType = 'MEASUREMENT' | 'NUTRITION' | 'ROUTINE' | 'CONSULTATION' | 'OTHER'

export type AppointmentStatus = 'OPEN' | 'BLOCKED' | 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'

export interface AppointmentRequest {
  id: number
  memberId: number | null
  memberName: string | null
  type: AppointmentType
  notes: string | null
  status: AppointmentStatus
  preferredStaffId: number | null
  preferredStaffName: string | null
  assignedStaffId: number | null
  assignedStaffName: string | null
  staffAvailabilityId: number | null
  scheduledStart: string | null
  scheduledEnd: string | null
  createdAt: string
}

export interface StaffAvailability {
  id: number
  staffId: number | null
  staffName: string | null
  availabilityDate: string
  startTime: string
  endTime: string
  slotDurationMinutes: number | null
}

export interface AvailableSlot {
  startTime: string
  endTime: string
  available: boolean
  appointmentId: number | null
}

export type BiologicalSex = 'MALE' | 'FEMALE'

export interface BodyMeasurementAnalysis {
  bmi: number | null
  bmiCategory: string | null
  bodyFatPercent: number | null
  bodyFatCategory: string | null
  waistHipRatio: number | null
  waistHipRisk: string | null
  bmrKcal: number | null
  idealWeightMinKg: number | null
  idealWeightMaxKg: number | null
  fatMassKg: number | null
  leanMassKg: number | null
  avgArmCm: number | null
  avgThighCm: number | null
  avgCalfCm: number | null
  recommendations: string[]
}

export interface BodyMeasurementComparison {
  previousMeasurementId: number | null
  previousMeasuredAt: string | null
  weightChangeKg: number | null
  waistChangeCm: number | null
  bodyFatChangePercent: number | null
  bmiChange: number | null
}

export interface BodyMeasurement {
  id: number | null
  memberId: number
  memberName: string
  recordedById: number | null
  recordedByName: string | null
  measuredAt: string
  ageYears: number
  sex: BiologicalSex
  weightKg: number
  heightCm: number
  neckCm: number | null
  chestCm: number | null
  waistCm: number | null
  hipsCm: number | null
  shouldersCm: number | null
  leftArmCm: number | null
  rightArmCm: number | null
  leftForearmCm: number | null
  rightForearmCm: number | null
  leftThighCm: number | null
  rightThighCm: number | null
  leftCalfCm: number | null
  rightCalfCm: number | null
  notes: string | null
  appointmentRequestId: number | null
  createdAt: string | null
  analysis: BodyMeasurementAnalysis
  comparison: BodyMeasurementComparison | null
}

export interface BodyMeasurementCreatePayload {
  memberId: number
  measuredAt?: string
  ageYears: number
  sex: BiologicalSex
  weightKg: number
  heightCm: number
  neckCm?: number
  chestCm?: number
  waistCm?: number
  hipsCm?: number
  shouldersCm?: number
  leftArmCm?: number
  rightArmCm?: number
  leftForearmCm?: number
  rightForearmCm?: number
  leftThighCm?: number
  rightThighCm?: number
  leftCalfCm?: number
  rightCalfCm?: number
  notes?: string
  appointmentRequestId?: number
}

export type NutritionPlanStatus = 'ACTIVE' | 'ARCHIVED'

export interface NutritionMealItem {
  id?: number | null
  foodName: string
  portion: string | null
  notes: string | null
  orderIndex?: number
}

export interface NutritionMeal {
  id?: number | null
  name: string
  suggestedTime: string | null
  notes: string | null
  orderIndex?: number
  items: NutritionMealItem[]
}

export interface NutritionPlan {
  id: number
  memberId: number
  memberName: string
  createdById: number
  createdByName: string
  title: string
  objective: string | null
  dailyCaloriesTarget: number | null
  proteinGrams: number | null
  carbsGrams: number | null
  fatGrams: number | null
  waterLiters: number | null
  guidelines: string[]
  notes: string | null
  status: NutritionPlanStatus
  validFrom: string | null
  validUntil: string | null
  meals: NutritionMeal[]
  createdAt: string
  updatedAt: string
}

export interface NutritionPlanCreatePayload {
  memberId: number
  title: string
  objective?: string
  dailyCaloriesTarget?: number
  proteinGrams?: number
  carbsGrams?: number
  fatGrams?: number
  waterLiters?: number
  guidelines?: string[]
  notes?: string
  validFrom?: string
  validUntil?: string
  meals?: {
    name: string
    suggestedTime?: string
    notes?: string
    items?: { foodName: string; portion?: string; notes?: string }[]
  }[]
}
