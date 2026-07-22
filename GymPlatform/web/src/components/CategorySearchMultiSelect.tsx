import { useMemo } from 'react'
import TagMultiSelect, { type TagOption } from './TagMultiSelect'

export type CategoryOption = {
  id: number
  name: string
}

type Props = {
  categories: CategoryOption[]
  value: number[]
  onChange: (value: number[]) => void
  emptyLabel?: string
  placeholder?: string
  searchPlaceholder?: string
  noResultsMessage?: string
  disabled?: boolean
  onCreate?: (name: string) => Promise<CategoryOption>
}

export default function CategorySearchMultiSelect({
  categories,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  noResultsMessage = 'Ninguna categoría coincide con la búsqueda',
  disabled = false,
  onCreate,
}: Props) {
  const options = useMemo<TagOption<number>[]>(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  )

  return (
    <TagMultiSelect
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={searchPlaceholder ?? placeholder ?? 'Escribe una categoría y pulsa Enter…'}
      noResultsMessage={noResultsMessage}
      creatingMessage="Creando categoría…"
      onCreate={
        onCreate
          ? async (name) => {
              const created = await onCreate(name)
              return { value: created.id, label: created.name }
            }
          : undefined
      }
    />
  )
}
