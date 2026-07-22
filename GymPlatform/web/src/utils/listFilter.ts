import { dateSearchTerms } from './dateFormat'

const MAX_DEPTH = 5
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function collectValues(value: unknown, depth = 0): string[] {
  if (depth > MAX_DEPTH || value == null) return []
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    if (typeof value === 'string' && ISO_DATE.test(value)) {
      return dateSearchTerms(value)
    }
    return [String(value)]
  }
  if (value instanceof Date) {
    return dateSearchTerms(value)
  }  if (Array.isArray(value)) {
    return value.flatMap((v) => collectValues(v, depth + 1))
  }
  if (typeof value === 'object') {
    return Object.values(value).flatMap((v) => collectValues(v, depth + 1))
  }
  return []
}

export function itemMatchesQuery<T>(
  item: T,
  query: string,
  extraValues?: (item: T) => string[],
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const values = [
    ...collectValues(item),
    ...(extraValues?.(item) ?? []),
  ]
  return values.some((v) => v.toLowerCase().includes(q))
}

export function filterByQuery<T>(
  items: T[],
  query: string,
  extraValues?: (item: T) => string[],
): T[] {
  if (!query.trim()) return items
  return items.filter((item) => itemMatchesQuery(item, query, extraValues))
}
