import { useMemo, useState } from 'react'
import ListFilterInput from '../components/ListFilterInput'
import { filterByQuery } from '../utils/listFilter'

export function useFilteredList<T>(
  items: T[],
  extraValues?: (item: T) => string[],
) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => filterByQuery(items, query, extraValues),
    [items, query],
  )
  const hasQuery = query.trim().length > 0

  const filterInput = items.length > 0 ? (
    <ListFilterInput
      value={query}
      onChange={setQuery}
      resultCount={filtered.length}
      totalCount={items.length}
    />
  ) : null

  return { query, setQuery, filtered, hasQuery, filterInput }
}
