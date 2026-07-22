import type { NutritionMeal, NutritionPlan, NutritionPlanCreatePayload } from '../types'

export type NutritionMealForm = {
  name: string
  suggestedTime: string
  notes: string
  items: { foodName: string; portion: string; notes: string }[]
}

export type NutritionPlanFormState = {
  memberId: number | ''
  title: string
  objective: string
  dailyCaloriesTarget: string
  proteinGrams: string
  carbsGrams: string
  fatGrams: string
  waterLiters: string
  guidelinesText: string
  notes: string
  meals: NutritionMealForm[]
}

export const MEAL_PRESETS = [
  'Desayuno',
  'Media mañana',
  'Almuerzo',
  'Merienda',
  'Cena',
  'Pre-entreno',
  'Post-entreno',
]

export const emptyMeal = (name = ''): NutritionMealForm => ({
  name,
  suggestedTime: '',
  notes: '',
  items: [{ foodName: '', portion: '', notes: '' }],
})

export const emptyNutritionForm = (): NutritionPlanFormState => ({
  memberId: '',
  title: '',
  objective: '',
  dailyCaloriesTarget: '',
  proteinGrams: '',
  carbsGrams: '',
  fatGrams: '',
  waterLiters: '2.5',
  guidelinesText: '',
  notes: '',
  meals: [emptyMeal('Desayuno'), emptyMeal('Almuerzo'), emptyMeal('Cena')],
})

export function planToForm(plan: NutritionPlan, memberId: number): NutritionPlanFormState {
  return {
    memberId,
    title: plan.title,
    objective: plan.objective ?? '',
    dailyCaloriesTarget: plan.dailyCaloriesTarget?.toString() ?? '',
    proteinGrams: plan.proteinGrams?.toString() ?? '',
    carbsGrams: plan.carbsGrams?.toString() ?? '',
    fatGrams: plan.fatGrams?.toString() ?? '',
    waterLiters: plan.waterLiters?.toString() ?? '',
    guidelinesText: plan.guidelines.join('\n'),
    notes: plan.notes?.replace(/^demo:[^\—]+—\s*/, '') ?? '',
    meals: plan.meals.length > 0
      ? plan.meals.map((m) => ({
          name: m.name,
          suggestedTime: m.suggestedTime ?? '',
          notes: m.notes ?? '',
          items: m.items.length > 0
            ? m.items.map((i) => ({
                foodName: i.foodName,
                portion: i.portion ?? '',
                notes: i.notes ?? '',
              }))
            : [{ foodName: '', portion: '', notes: '' }],
        }))
      : [emptyMeal()],
  }
}

function parseOptionalInt(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined
}

function parseOptionalDouble(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export function formToNutritionPayload(form: NutritionPlanFormState): NutritionPlanCreatePayload | null {
  if (!form.memberId || !form.title.trim()) return null

  const meals = form.meals
    .filter((m) => m.name.trim())
    .map((m) => ({
      name: m.name.trim(),
      suggestedTime: m.suggestedTime.trim() || undefined,
      notes: m.notes.trim() || undefined,
      items: m.items
        .filter((i) => i.foodName.trim())
        .map((i) => ({
          foodName: i.foodName.trim(),
          portion: i.portion.trim() || undefined,
          notes: i.notes.trim() || undefined,
        })),
    }))

  const guidelines = form.guidelinesText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  return {
    memberId: form.memberId,
    title: form.title.trim(),
    objective: form.objective.trim() || undefined,
    dailyCaloriesTarget: parseOptionalInt(form.dailyCaloriesTarget),
    proteinGrams: parseOptionalInt(form.proteinGrams),
    carbsGrams: parseOptionalInt(form.carbsGrams),
    fatGrams: parseOptionalInt(form.fatGrams),
    waterLiters: parseOptionalDouble(form.waterLiters),
    guidelines: guidelines.length > 0 ? guidelines : undefined,
    notes: form.notes.trim() || undefined,
    meals: meals.length > 0 ? meals : undefined,
  }
}

export function formatPlanDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CR', { dateStyle: 'medium' })
}

export function activePlan(plans: NutritionPlan[]): NutritionPlan | null {
  return plans.find((p) => p.status === 'ACTIVE') ?? null
}
