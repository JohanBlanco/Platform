import CategorySearchMultiSelect, { type CategoryOption } from './CategorySearchMultiSelect'

export type CategoryTagOption = CategoryOption

type Props = {
  categories: CategoryTagOption[]
  value: number[]
  onChange: (value: number[]) => void
  onCreate: (name: string) => Promise<CategoryTagOption>
  placeholder?: string
  disabled?: boolean
}

/** Alias con creación habilitada (formulario de producto). */
export default function CategoryTagInput({
  categories,
  value,
  onChange,
  onCreate,
  placeholder = 'Escribe una categoría y pulsa Enter…',
  disabled = false,
}: Props) {
  return (
    <CategorySearchMultiSelect
      categories={categories}
      value={value}
      onChange={onChange}
      onCreate={onCreate}
      placeholder={placeholder}
      searchPlaceholder={placeholder}
      disabled={disabled}
    />
  )
}
